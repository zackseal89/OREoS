import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { OnboardingStepper } from "../components/intake/OnboardingStepper";
import { IntakeFormPanel } from "../components/intake/IntakeFormPanel";
import { IntakePreviewPanel } from "../components/intake/IntakePreviewPanel";
import { supabase } from "../lib/supabase";
import { queryKeys } from "../lib/queryKeys";
import { errorMessage, functionErrorMessage } from "../lib/errors";
import { useSession } from "../context/SessionContext";
import type { IntakeStage, ProductDossier, ProductSourceType } from "../types";

/** Poll the product row until the pipeline leaves the `processing` state. */
async function pollProduct(
  productId: string,
  { tries = 30, intervalMs = 2000 } = {},
): Promise<{ status: string; dossier: unknown } | null> {
  for (let i = 0; i < tries; i++) {
    const { data } = await supabase
      .from("products")
      .select("status, dossier")
      .eq("id", productId)
      .maybeSingle();
    if (data && data.status !== "processing") return data;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}

const EXTRACTION_CAPTIONS = [
  "Reading brand colors…",
  "Analyzing typography…",
  "Extracting voice & tone…",
  "Compiling value props…",
];

function nameFromUrl(url: string): string {
  const slug = url.split("/").filter(Boolean).pop() ?? "";
  const cleaned = slug.replace(/[-_]+/g, " ").replace(/\.\w+$/, "").trim();
  return cleaned.length > 0 ? cleaned.replace(/\b\w/g, (c) => c.toUpperCase()) : "New Product";
}

function nameFromFile(file: File): string {
  return file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
}

export function ProductIntakePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeWorkspace } = useSession();
  const [stage, setStage] = useState<IntakeStage>("input");
  const [mode, setMode] = useState<ProductSourceType>("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dossier, setDossier] = useState<ProductDossier | null>(null);
  const [productName, setProductName] = useState("");
  const [productId, setProductId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captionIndex, setCaptionIndex] = useState(0);

  const canSubmit = mode === "url" ? url.trim().length > 0 : file !== null;

  // Cycle the extraction status captions while the "extracting" stage is showing.
  useEffect(() => {
    if (stage !== "extracting") return;
    setCaptionIndex(0);
    const timer = setInterval(() => {
      setCaptionIndex((index) => Math.min(index + 1, EXTRACTION_CAPTIONS.length - 1));
    }, 500);
    return () => clearInterval(timer);
  }, [stage]);

  const handleExtract = async () => {
    if (!activeWorkspace) return;
    const name = mode === "url" ? nameFromUrl(url) : nameFromFile(file!);
    setProductName(name);
    setError(null);
    setStage("extracting");

    try {
      // Uploaded images go to the workspace-scoped uploads bucket first.
      let uploadPath: string | null = null;
      if (mode === "upload" && file) {
        uploadPath = `${activeWorkspace.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(uploadPath, file);
        if (uploadError) throw new Error(`Image upload failed: ${errorMessage(uploadError)}`);
      }

      const { data: inserted, error: insertError } = await supabase
        .from("products")
        .insert({
          workspace_id: activeWorkspace.id,
          name,
          source_type: mode,
          source_url: mode === "url" ? url.trim() : null,
          upload_path: uploadPath,
          status: "processing",
        })
        .select("id")
        .single();
      if (insertError) throw new Error(`Couldn't create product: ${errorMessage(insertError)}`);
      setProductId(inserted.id);

      // Kick off extraction (Firecrawl scrape → Gemini dossier), then poll.
      const { error: fnError } = await supabase.functions.invoke("extract-dossier", {
        body: { productId: inserted.id },
      });
      // Capture the function's own error body (e.g. a missing API key) up front.
      const fnMessage = fnError ? await functionErrorMessage(fnError) : "";

      const final = await pollProduct(inserted.id);

      if (final?.status === "ready" && final.dossier) {
        setDossier(final.dossier as unknown as ProductDossier);
        void queryClient.invalidateQueries({ queryKey: queryKeys.products(activeWorkspace.id) });
        setStage("review");
      } else {
        throw new Error(
          fnMessage ||
            "The dossier couldn't be generated for this product. Please try again or use a different source.",
        );
      }
    } catch (err) {
      setError(errorMessage(err));
      setStage("input");
    }
  };

  const handleSave = () => {
    // The product is already persisted; confirm and move on.
    setSaving(true);
    if (activeWorkspace) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products(activeWorkspace.id) });
    }
    setSaving(false);
    setStage("saved");
  };

  const handleRestart = () => {
    setStage("input");
    setUrl("");
    setFile(null);
    setDossier(null);
    setProductName("");
    setProductId(null);
    setError(null);
  };

  const handleViewProduct = () => {
    if (productId) navigate(`/products/${productId}`);
    else navigate("/products");
  };

  return (
    <main className="flex flex-1 flex-col lg:grid lg:grid-cols-[440px_1fr]">
      <div className="flex flex-col justify-center gap-10 px-10 py-12 lg:border-r lg:border-line">
        <OnboardingStepper stage={stage} />
        <IntakeFormPanel
          stage={stage}
          mode={mode}
          onModeChange={setMode}
          url={url}
          onUrlChange={setUrl}
          fileName={file?.name ?? null}
          onFileSelect={setFile}
          onSubmit={handleExtract}
          canSubmit={canSubmit}
          productName={productName}
          onSave={handleSave}
          onRestart={handleRestart}
          onViewProduct={handleViewProduct}
          saving={saving}
          error={error}
        />
      </div>

      <div className="flex min-h-[360px] items-center justify-center bg-canvas p-10">
        <IntakePreviewPanel
          stage={stage}
          mode={mode}
          url={url}
          file={file}
          caption={EXTRACTION_CAPTIONS[captionIndex]}
          dossier={dossier}
          productName={productName}
        />
      </div>
    </main>
  );
}

import { useEffect, useState } from "react";
import { OnboardingStepper } from "../components/intake/OnboardingStepper";
import { IntakeFormPanel } from "../components/intake/IntakeFormPanel";
import { IntakePreviewPanel } from "../components/intake/IntakePreviewPanel";
import { mockExtractDossier } from "../data/products";
import type { IntakeStage, ProductDossier, ProductSourceType } from "../types";

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
  const [stage, setStage] = useState<IntakeStage>("input");
  const [mode, setMode] = useState<ProductSourceType>("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dossier, setDossier] = useState<ProductDossier | null>(null);
  const [productName, setProductName] = useState("");
  const [saving, setSaving] = useState(false);
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

  const handleExtract = () => {
    setProductName(mode === "url" ? nameFromUrl(url) : nameFromFile(file!));
    setStage("extracting");
    setTimeout(() => {
      setDossier(mockExtractDossier());
      setStage("review");
    }, 2200);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setStage("saved");
    }, 500);
  };

  const handleRestart = () => {
    setStage("input");
    setUrl("");
    setFile(null);
    setDossier(null);
    setProductName("");
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
          saving={saving}
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

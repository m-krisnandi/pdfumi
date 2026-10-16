import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import {
  Minimize2,
  ArrowLeftRight,
  Image,
  Combine,
  Scissors,
  RotateCw,
  Trash2,
  FileOutput,
  LayoutGrid,
  Hash,
  Crop,
  Stamp,
  PenTool,
  Lock,
  Unlock,
  ReceiptText,
  Award,
  FileText,
  FileSpreadsheet,
  Presentation,
  PenLine,
  EyeOff,
  Scaling,
  UserCheck,
  Sparkles,
  Camera,
  Heading,
  Layers,
  Eraser,
  Contrast,
  Receipt,
  ScrollText,
  FileCheck,
  ImageDown,
} from "lucide-react";

export type ToolStatus = "live" | "soon";

export type ToolDef = {
  id: string;
  href?: `/${string}`;
  status: ToolStatus;
  /** Color token for icon chip */
  tone: "coral" | "amber" | "blue" | "green" | "orange" | "violet" | "teal";
  icon: ComponentType<LucideProps>;
};

export type ToolGroup = {
  id: string;
  tools: ToolDef[];
};

export type MegaMenuSection = {
  id: string;
  tools: ToolDef[];
};

export type MegaMenuColumn = {
  id: string;
  sections: MegaMenuSection[];
};

/**
 * 6 balanced columns laid out horizontally across the viewport (Smallpdf-style).
 * Every tool is visible at a single glance without scrolling on desktop.
 */
export const MEGA_MENU_COLUMNS: MegaMenuColumn[] = [
  {
    id: "col-compress-img",
    sections: [
      {
        id: "compress",
        tools: [
          { id: "compressPdf", href: "/tools/compress-pdf", status: "live", tone: "coral", icon: Minimize2 },
          { id: "compressImage", href: "/tools/compress-image", status: "live", tone: "coral", icon: ImageDown },
        ],
      },
      {
        id: "imageToPdf",
        tools: [
          { id: "jpgToPdf", href: "/tools/jpg-to-pdf", status: "live", tone: "amber", icon: Image },
          { id: "pngToPdf", href: "/tools/png-to-pdf", status: "live", tone: "amber", icon: Image },
          { id: "webpToPdf", href: "/tools/webp-to-pdf", status: "live", tone: "amber", icon: Image },
          { id: "heicToPdf", href: "/tools/heic-to-pdf", status: "live", tone: "amber", icon: Image },
        ],
      },
    ],
  },
  {
    id: "col-convert-office",
    sections: [
      {
        id: "office",
        tools: [
          { id: "pdfToWord", href: "/tools/pdf-to-word", status: "live", tone: "blue", icon: FileText },
          { id: "wordToPdf", href: "/tools/word-to-pdf", status: "live", tone: "blue", icon: FileText },
          { id: "pdfToExcel", href: "/tools/pdf-to-excel", status: "live", tone: "green", icon: FileSpreadsheet },
          { id: "excelToPdf", href: "/tools/excel-to-pdf", status: "live", tone: "green", icon: FileSpreadsheet },
          { id: "pdfToPpt", href: "/tools/pdf-converter", status: "live", tone: "orange", icon: Presentation },
          { id: "pptToPdf", href: "/tools/pdf-converter", status: "live", tone: "orange", icon: Presentation },
        ],
      },
      {
        id: "convert",
        tools: [
          { id: "pdfConverter", href: "/tools/pdf-converter", status: "live", tone: "amber", icon: ArrowLeftRight },
          { id: "pdfToJpg", href: "/tools/pdf-to-jpg", status: "live", tone: "amber", icon: Image },
          { id: "pdfToPng", href: "/tools/pdf-to-png", status: "live", tone: "amber", icon: Image },
        ],
      },
    ],
  },
  {
    id: "col-organize",
    sections: [
      {
        id: "organize",
        tools: [
          { id: "mergePdf", href: "/tools/merge-pdf", status: "live", tone: "violet", icon: Combine },
          { id: "splitPdf", href: "/tools/split-pdf", status: "live", tone: "violet", icon: Scissors },
          { id: "rotatePdf", href: "/tools/rotate-pdf", status: "live", tone: "violet", icon: RotateCw },
          { id: "deletePages", href: "/tools/delete-pdf-pages", status: "live", tone: "violet", icon: Trash2 },
          { id: "extractPages", href: "/tools/extract-pdf-pages", status: "live", tone: "violet", icon: FileOutput },
          { id: "organizePdf", href: "/tools/organize-pdf", status: "live", tone: "violet", icon: LayoutGrid },
          { id: "pageNumbersPdf", href: "/tools/page-numbers-pdf", status: "live", tone: "violet", icon: Hash },
          { id: "cropPdf", href: "/tools/crop-pdf", status: "live", tone: "violet", icon: Crop },
        ],
      },
    ],
  },
  {
    id: "col-edit-protect",
    sections: [
      {
        id: "edit",
        tools: [
          { id: "editPdf", href: "/tools/edit-pdf", status: "live", tone: "teal", icon: PenLine },
          { id: "redactPdf", href: "/tools/redact-pdf", status: "live", tone: "teal", icon: EyeOff },
          { id: "watermark", href: "/tools/watermark-pdf", status: "live", tone: "teal", icon: Stamp },
          { id: "headerFooterPdf", href: "/tools/header-footer-pdf", status: "live", tone: "teal", icon: Heading },
          { id: "flattenPdf", href: "/tools/flatten-pdf", status: "live", tone: "teal", icon: Layers },
          { id: "grayscalePdf", href: "/tools/grayscale-pdf", status: "live", tone: "teal", icon: Contrast },
          { id: "removeMetadataPdf", href: "/tools/remove-metadata-pdf", status: "live", tone: "teal", icon: Eraser },
        ],
      },
      {
        id: "protect",
        tools: [
          { id: "protectPdf", href: "/tools/protect-pdf", status: "live", tone: "teal", icon: Lock },
          { id: "unlockPdf", href: "/tools/unlock-pdf", status: "live", tone: "teal", icon: Unlock },
        ],
      },
    ],
  },
  {
    id: "col-sign-image-scan",
    sections: [
      {
        id: "fillAndSign",
        tools: [
          { id: "fillPdf", href: "/tools/fill-pdf", status: "live", tone: "teal", icon: FileCheck },
          { id: "signPdf", href: "/tools/sign-pdf", status: "live", tone: "teal", icon: PenTool },
        ],
      },
      {
        id: "image",
        tools: [
          { id: "resizeImage", href: "/tools/resize-image", status: "live", tone: "orange", icon: Scaling },
          { id: "pasFoto", href: "/tools/pas-foto", status: "live", tone: "orange", icon: UserCheck },
          { id: "removeSignatureBg", href: "/tools/remove-signature-bg", status: "live", tone: "orange", icon: Sparkles },
        ],
      },
      {
        id: "scan",
        tools: [
          { id: "scanPdf", href: "/tools/scan-pdf", status: "live", tone: "blue", icon: Camera },
        ],
      },
    ],
  },
  {
    id: "col-create",
    sections: [
      {
        id: "create",
        tools: [
          { id: "receipt", href: "/tools/kwitansi", status: "live", tone: "green", icon: ReceiptText },
          { id: "invoice", href: "/tools/invoice", status: "live", tone: "green", icon: Receipt },
          { id: "certificates", href: "/tools/sertifikat", status: "live", tone: "green", icon: Award },
          { id: "suratResmi", href: "/tools/surat", status: "live", tone: "green", icon: ScrollText },
          { id: "kontrak", href: "/tools/kontrak", status: "live", tone: "green", icon: FileCheck },
        ],
      },
    ],
  },
];

/** Backward compatible flat groups */
export const TOOL_GROUPS: ToolGroup[] = MEGA_MENU_COLUMNS.flatMap((col) =>
  col.sections.map((sec) => ({
    id: sec.id,
    tools: sec.tools,
  }))
);

export const TONE_CLASS: Record<ToolDef["tone"], string> = {
  coral: "bg-[#e85d4c] text-white",
  amber: "bg-[#e8a838] text-white",
  blue: "bg-[#3b6fd9] text-white",
  green: "bg-[#2f9e6b] text-white",
  orange: "bg-[#e07a3a] text-white",
  violet: "bg-[#7b5ea7] text-white",
  teal: "bg-[#2a9d8f] text-white",
};

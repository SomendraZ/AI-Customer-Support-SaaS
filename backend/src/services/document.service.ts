import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export interface ExtractedPage {
  text: string;
  pageNumber?: number;
}

export const extractText = async (
  file: Express.Multer.File,
): Promise<ExtractedPage[]> => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (extension === ".pdf") {
    const parser = new PDFParse({ data: file.buffer });
    const result = await parser.getText();
    await parser.destroy();

    return result.pages
      .map((page, index) => ({
        text: page.text.trim(),
        pageNumber: index + 1,
      }))
      .filter((page) => page.text);
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({
      buffer: file.buffer,
    });

    return result.value.trim() ? [{ text: result.value.trim() }] : [];
  }

  if (extension === ".txt") {
    const text = file.buffer.toString("utf-8").trim();

    return text ? [{ text }] : [];
  }

  throw new Error("Unsupported document format");
};

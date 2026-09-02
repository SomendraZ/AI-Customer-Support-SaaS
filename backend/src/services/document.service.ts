import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export const extractText = async (
  file: Express.Multer.File,
): Promise<string> => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (extension === ".pdf") {
    const parser = new PDFParse({ data: file.buffer });
    const result = await parser.getText();
    await parser.destroy();

    return result.text.trim();
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({
      buffer: file.buffer,
    });

    return result.value.trim();
  }

  if (extension === ".txt") {
    return file.buffer.toString("utf-8").trim();
  }

  throw new Error("Unsupported document format");
};

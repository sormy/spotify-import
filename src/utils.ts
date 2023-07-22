import { readFileSync } from "fs";

function csvDecode(line: string) {
  const values = [];
  let buffer = "";
  let quoted = false;
  let index = 0;
  while (index < line.length) {
    const curChar = line.substr(index, 1);
    const nextChar = line.substr(index + 1, 1);
    if (curChar === '"') {
      if (nextChar === '"') {
        buffer += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && curChar === ",") {
      values.push(buffer);
      buffer = "";
    } else {
      buffer += curChar;
    }
    if (index === line.length - 1) {
      values.push(buffer);
    }
    index += 1;
  }
  return values;
}

export function readJsonFile(filename: string) {
  const content = readFileSync(filename, "utf-8");
  return JSON.parse(content);
}

export function readTsvFile(filename: string) {
  const content = readFileSync(filename, "utf-8");
  const lines = content.trim().split(/\n/);
  let headers = lines[0].split("\t");
  return lines
    .slice(1)
    .map((item) =>
      Object.fromEntries(
        item.split("\t").map((col, index) => [headers[index], col]),
      ),
    );
}

export function readCsvFile(filename: string) {
  const content = readFileSync(filename, "utf-8");
  const lines = content.trim().split(/\r\n|\r|\n/);
  let headers = csvDecode(lines[0]);
  return lines
    .slice(1)
    .map((item) =>
      Object.fromEntries(
        csvDecode(item).map((col, index) => [headers[index], col]),
      ),
    );
}

export function parseDuration(durationStr: string) {
  if (/^\d+:\d+$/.test(durationStr)) {
    const parts = durationStr.split(":");
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  } else {
  }
}

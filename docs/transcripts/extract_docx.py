# -*- coding: utf-8 -*-
import os
import sys
import zipfile
import xml.etree.ElementTree as ET

NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

def text_from_docx(path):
    with zipfile.ZipFile(path, "r") as z:
        xml = z.read("word/document.xml")
    root = ET.fromstring(xml)
    paras = []
    for p in root.iter("{%s}p" % NS):
        texts = []
        for t in p.iter("{%s}t" % NS):
            if t.text:
                texts.append(t.text)
            if t.tail:
                texts.append(t.tail)
        paras.append("".join(texts))
    return "\n".join(paras)

def main():
    folder = os.path.dirname(os.path.abspath(__file__))
    if len(sys.argv) > 1:
        folder = os.path.abspath(sys.argv[1])
    for f in sorted(os.listdir(folder)):
        if f.endswith(".docx") and not f.startswith("~"):
            path = os.path.join(folder, f)
            try:
                text = text_from_docx(path)
                out = f.replace(".docx", ".txt")
                outpath = os.path.join(folder, out)
                with open(outpath, "w", encoding="utf-8") as o:
                    o.write(text)
                print("OK:", f, "->", out, len(text), "chars")
            except Exception as e:
                print("ERR:", f, e)

if __name__ == "__main__":
    main()

import os
from pathlib import Path

def list_files(root: Path, exclude_names: set, output_file: Path):
    with open(output_file, "w", encoding="utf-8") as f:
        for dirpath, dirnames, filenames in os.walk(root):
            # امنع النزول في أي فولدر اسمه في قائمة الاستثناءات
            dirnames[:] = [d for d in dirnames if d not in exclude_names]

            for fname in filenames:
                full_path = Path(dirpath) / fname
                # هنا بنكتب المسار نسبةً إلى الفولدر الأساسي
                relative_path = full_path.relative_to(root)
                f.write(str(relative_path) + "\n")

if __name__ == "__main__":
    # حدد الفولدر اللي تبدأ منه
    root_folder = Path(".")  # هنا النقطة معناها "المجلد الحالي"
    # حط أسماء الفولدرات اللي عايز تستبعدها
    exclude = {"node_modules", ".git"}
    # اسم الفايل اللي هيتكتب فيه النتائج
    output = Path("files.txt")

    list_files(root_folder, exclude, output)
    print(f"تم حفظ النتائج في {output.resolve()}")

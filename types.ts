import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/marks")({
  head: () => ({ meta: [{ title: "Marks — Scholaris" }] }),
  component: MarksPage,
});

type Student = { user_id: string; full_name: string };
type Course = { id: string; code: string; name: string };
type Mark = {
  id: string;
  student_id: string;
  course_id: string;
  exam_type: string;
  marks_obtained: number;
  max_marks: number;
};

function MarksPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");

  const load = async () => {
    const { data: s } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .order("full_name");
    setStudents((s ?? []) as Student[]);
    const { data: c } = await supabase.from("courses").select("id, code, name").order("code");
    setCourses((c ?? []) as Course[]);
    const { data: m } = await supabase
      .from("marks")
      .select("*")
      .order("created_at", { ascending: false });
    setMarks((m ?? []) as Mark[]);
  };
  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!studentId || !courseId) return toast.error("Select student and course");
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("marks").upsert(
      {
        student_id: studentId,
        course_id: courseId,
        exam_type: String(fd.get("exam_type") || "final"),
        marks_obtained: Number(fd.get("marks_obtained")),
        max_marks: Number(fd.get("max_marks") || 100),
      },
      { onConflict: "student_id,course_id,exam_type" },
    );
    if (error) return toast.error(error.message);
    toast.success("Marks saved");
    (e.target as HTMLFormElement).reset();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this mark entry?")) return;
    await supabase.from("marks").delete().eq("id", id);
    load();
  };

  const studentName = (id: string) => students.find((s) => s.user_id === id)?.full_name ?? "—";
  const courseLabel = (id: string) => {
    const c = courses.find((x) => x.id === id);
    return c ? `${c.code}` : "—";
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Marks</h1>
        <p className="text-muted-foreground mt-1">Enter and review subject-wise marks.</p>
      </div>

      <form
        onSubmit={submit}
        className="rounded-2xl border border-border bg-card p-5 shadow-elegant mb-6 grid md:grid-cols-6 gap-3 items-end"
      >
        <div className="md:col-span-2">
          <Label>Student</Label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.user_id} value={s.user_id}>
                  {s.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Course</Label>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Exam</Label>
          <Input name="exam_type" defaultValue="final" maxLength={30} />
        </div>
        <div>
          <Label>Marks</Label>
          <div className="flex gap-2">
            <Input name="marks_obtained" type="number" step="0.01" required />
            <Input name="max_marks" type="number" defaultValue={100} className="w-20" />
          </div>
        </div>
        <div className="md:col-span-6">
          <Button type="submit" className="bg-gradient-warm border-0">
            Save marks
          </Button>
        </div>
      </form>

      <div className="rounded-2xl border border-border bg-card shadow-elegant overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Exam</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>%</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {marks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No marks recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              marks.map((m) => {
                const pct = (Number(m.marks_obtained) / Number(m.max_marks)) * 100;
                const pass = pct >= 40;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{studentName(m.student_id)}</TableCell>
                    <TableCell className="font-mono">{courseLabel(m.course_id)}</TableCell>
                    <TableCell className="capitalize">{m.exam_type}</TableCell>
                    <TableCell>
                      {m.marks_obtained}/{m.max_marks}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          pass
                            ? "bg-accent/20 text-accent-foreground"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {pct.toFixed(1)}% {pass ? "Pass" : "Fail"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => remove(m.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}

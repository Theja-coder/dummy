import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useEffect, useMemo, useState } from "react";
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
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/attendance")({
  head: () => ({ meta: [{ title: "Attendance — Scholaris" }] }),
  component: AttendancePage,
});

type Student = { user_id: string; full_name: string };
type Course = { id: string; code: string; name: string };

function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, "present" | "absent">>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .order("full_name");
      setStudents((s ?? []) as Student[]);
      const { data: c } = await supabase.from("courses").select("id, code, name").order("code");
      setCourses((c ?? []) as Course[]);
    })();
  }, []);

  useEffect(() => {
    if (!courseId || !date) return;
    (async () => {
      const { data } = await supabase
        .from("attendance")
        .select("student_id, status")
        .eq("course_id", courseId)
        .eq("date", date);
      const map: Record<string, "present" | "absent"> = {};
      (data ?? []).forEach((r) => (map[r.student_id] = r.status as "present" | "absent"));
      setMarks(map);
    })();
  }, [courseId, date]);

  const courseLabel = useMemo(
    () => courses.find((c) => c.id === courseId),
    [courses, courseId],
  );

  const save = async () => {
    if (!courseId) return toast.error("Select a course");
    setSaving(true);
    const rows = students.map((s) => ({
      student_id: s.user_id,
      course_id: courseId,
      date,
      status: marks[s.user_id] ?? "absent",
    }));
    const { error } = await supabase
      .from("attendance")
      .upsert(rows, { onConflict: "student_id,course_id,date" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Attendance saved");
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground mt-1">Mark daily attendance per course.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant mb-6 grid md:grid-cols-3 gap-4">
        <div>
          <Label>Course</Label>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
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
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button onClick={save} disabled={!courseId || saving} className="w-full bg-gradient-warm border-0">
            {saving ? "Saving…" : "Save attendance"}
          </Button>
        </div>
      </div>

      {courseId ? (
        <div className="rounded-2xl border border-border bg-card shadow-elegant overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/40">
            <div className="text-sm font-medium">
              {courseLabel?.code} — {courseLabel?.name}{" "}
              <span className="text-muted-foreground">· {date}</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {students.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No students.</div>
            ) : (
              students.map((s) => {
                const status = marks[s.user_id] ?? "absent";
                return (
                  <div
                    key={s.user_id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <span className="font-medium">{s.full_name}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={status === "present" ? "default" : "outline"}
                        className={status === "present" ? "bg-gradient-warm border-0" : ""}
                        onClick={() => setMarks({ ...marks, [s.user_id]: "present" })}
                      >
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant={status === "absent" ? "destructive" : "outline"}
                        onClick={() => setMarks({ ...marks, [s.user_id]: "absent" })}
                      >
                        Absent
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Select a course to mark attendance.
        </div>
      )}
    </DashboardLayout>
  );
}

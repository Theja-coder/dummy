import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/courses")({
  head: () => ({ meta: [{ title: "Courses — Scholaris" }] }),
  component: CoursesPage,
});

type Course = {
  id: string;
  code: string;
  name: string;
  department: string;
  faculty_id: string | null;
  faculty?: { full_name: string } | null;
};
type Faculty = { id: string; full_name: string };

function CoursesPage() {
  const [rows, setRows] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [open, setOpen] = useState(false);
  const [facultyId, setFacultyId] = useState<string>("none");

  const load = async () => {
    const { data } = await supabase
      .from("courses")
      .select("id, code, name, department, faculty_id, faculty(full_name)")
      .order("code");
    setRows((data ?? []) as Course[]);
    const { data: f } = await supabase.from("faculty").select("id, full_name").order("full_name");
    setFaculty((f ?? []) as Faculty[]);
  };
  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("courses").insert({
      code: String(fd.get("code")).trim(),
      name: String(fd.get("name")).trim(),
      department: String(fd.get("department")).trim(),
      faculty_id: facultyId === "none" ? null : facultyId,
    });
    if (error) return toast.error(error.message);
    toast.success("Course added");
    setOpen(false);
    setFacultyId("none");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground mt-1">Manage courses and assign faculty.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-warm border-0">
              <Plus className="h-4 w-4 mr-1" /> Add course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New course</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="c-code">Code</Label>
                  <Input id="c-code" name="code" required maxLength={20} />
                </div>
                <div>
                  <Label htmlFor="c-dept">Department</Label>
                  <Input id="c-dept" name="department" required maxLength={100} />
                </div>
              </div>
              <div>
                <Label htmlFor="c-name">Name</Label>
                <Input id="c-name" name="name" required maxLength={150} />
              </div>
              <div>
                <Label>Faculty</Label>
                <Select value={facultyId} onValueChange={setFacultyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Unassigned —</SelectItem>
                    {faculty.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-gradient-warm border-0">
                  Add
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-elegant overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Faculty</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No courses yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono font-medium">{r.code}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.department}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.faculty?.full_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}

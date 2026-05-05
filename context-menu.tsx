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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/faculty")({
  head: () => ({ meta: [{ title: "Faculty — Scholaris" }] }),
  component: FacultyPage,
});

type Faculty = { id: string; full_name: string; email: string; department: string };

function FacultyPage() {
  const [rows, setRows] = useState<Faculty[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("faculty").select("*").order("full_name");
    if (error) toast.error(error.message);
    setRows((data ?? []) as Faculty[]);
  };
  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("faculty").insert({
      full_name: String(fd.get("full_name")).trim(),
      email: String(fd.get("email")).trim(),
      department: String(fd.get("department")).trim(),
    });
    if (error) return toast.error(error.message);
    toast.success("Faculty added");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this faculty member?")) return;
    const { error } = await supabase.from("faculty").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faculty</h1>
          <p className="text-muted-foreground mt-1">Manage faculty members.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-warm border-0">
              <Plus className="h-4 w-4 mr-1" /> Add faculty
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New faculty member</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label htmlFor="f-name">Full name</Label>
                <Input id="f-name" name="full_name" required maxLength={100} />
              </div>
              <div>
                <Label htmlFor="f-email">Email</Label>
                <Input id="f-email" name="email" type="email" required maxLength={255} />
              </div>
              <div>
                <Label htmlFor="f-dept">Department</Label>
                <Input id="f-dept" name="department" required maxLength={100} />
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No faculty yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.email}</TableCell>
                  <TableCell>{r.department}</TableCell>
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

import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, CalendarCheck, Award, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — Scholaris" }] }),
  component: DashboardIndex,
});

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="h-9 w-9 rounded-lg bg-gradient-warm flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState({ students: 0, faculty: 0, courses: 0, attendance: 0, marks: 0 });

  useEffect(() => {
    (async () => {
      const [students, faculty, courses, attendance, marks] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("faculty").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("attendance").select("id", { count: "exact", head: true }),
        supabase.from("marks").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        students: students.count ?? 0,
        faculty: faculty.count ?? 0,
        courses: courses.count ?? 0,
        attendance: attendance.count ?? 0,
        marks: marks.count ?? 0,
      });
    })();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">Snapshot of your institution.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Students" value={stats.students} />
        <StatCard icon={GraduationCap} label="Faculty" value={stats.faculty} />
        <StatCard icon={BookOpen} label="Courses" value={stats.courses} />
        <StatCard icon={CalendarCheck} label="Attendance records" value={stats.attendance} />
        <StatCard icon={Award} label="Marks records" value={stats.marks} />
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-gradient-warm p-8 text-primary-foreground shadow-elegant">
        <h2 className="text-2xl font-bold">Welcome, administrator</h2>
        <p className="opacity-90 mt-2 max-w-2xl">
          Use the sidebar to manage students, faculty, courses, attendance, and marks. All changes are
          stored securely with row-level security.
        </p>
      </div>
    </div>
  );
}

function StudentOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ courses: 0, present: 0, total: 0, avgPct: 0 });
  const [name, setName] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      setName(profile?.full_name ?? "");

      const { count: courses } = await supabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("student_id", user.id);

      const { data: att } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", user.id);
      const present = (att ?? []).filter((a) => a.status === "present").length;
      const total = att?.length ?? 0;

      const { data: marks } = await supabase
        .from("marks")
        .select("marks_obtained, max_marks")
        .eq("student_id", user.id);
      const avgPct =
        marks && marks.length
          ? marks.reduce((s, m) => s + (Number(m.marks_obtained) / Number(m.max_marks)) * 100, 0) /
            marks.length
          : 0;

      setStats({ courses: courses ?? 0, present, total, avgPct });
    })();
  }, [user]);

  const attendancePct = stats.total ? Math.round((stats.present / stats.total) * 100) : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Hi{name ? `, ${name.split(" ")[0]}` : ""} 👋</h1>
        <p className="text-muted-foreground mt-1">Your academic snapshot.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={BookOpen} label="Enrolled courses" value={stats.courses} />
        <StatCard
          icon={CalendarCheck}
          label="Attendance"
          value={`${attendancePct}%`}
          hint={`${stats.present}/${stats.total} classes`}
        />
        <StatCard icon={Award} label="Average score" value={`${stats.avgPct.toFixed(1)}%`} />
      </div>
    </div>
  );
}

function DashboardIndex() {
  const { role } = useAuth();
  return <DashboardLayout>{role === "admin" ? <AdminOverview /> : <StudentOverview />}</DashboardLayout>;
}

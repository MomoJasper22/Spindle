import { redirect } from 'next/navigation'

export default function TechnicianScheduleRedirectPage() {
  redirect('/technician/jobs?tab=today')
}

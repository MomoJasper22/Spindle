import { redirect } from 'next/navigation'

export default function TechnicianCollectionsRedirectPage() {
  redirect('/technician/jobs?tab=collections')
}

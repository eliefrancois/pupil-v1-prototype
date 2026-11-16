'use server'

import { captureServerEvent } from '@/lib/analytics/server'
import { createServiceClient } from '@/lib/supabase/service'
import { notifyCounselorOfEligibilityApplication } from '@/lib/email/notifications'
import { normalizeEmail, validateEmail } from '@/lib/validation/email'
import { ELIGIBILITY_TYPES, type EligibilityType } from '@/lib/eligibility'

export type EligibilityApplicationInput = {
  studentName: string
  parentName: string
  email: string
  studentEmail: string
  grade: string
  schoolName: string
  eligibilityType: string
  counselorEmail: string
  consent: boolean
  website: string
}

export type EligibilityApplicationResult =
  | { ok: true; emailSent: boolean }
  | { ok: false; error: string }

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000

function cleanText(value: string, max: number): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, max)
}

export async function submitEligibilityApplication(
  input: EligibilityApplicationInput
): Promise<EligibilityApplicationResult> {
  if (input.website.trim()) return { ok: true, emailSent: true }

  const studentName = cleanText(input.studentName, 120)
  const parentName = cleanText(input.parentName, 120)
  const school = cleanText(input.schoolName, 160)
  const grade = Number.parseInt(input.grade, 10)

  if (!studentName) return { ok: false, error: 'Enter the student\u2019s name.' }
  if (!parentName) {
    return { ok: false, error: 'Enter the parent or guardian\u2019s name.' }
  }
  if (![9, 10, 11, 12].includes(grade)) {
    return { ok: false, error: 'Pick the student\u2019s grade.' }
  }
  if (!school) return { ok: false, error: 'Enter the student\u2019s school.' }
  if (!ELIGIBILITY_TYPES.includes(input.eligibilityType as EligibilityType)) {
    return { ok: false, error: 'Pick an eligibility type.' }
  }

  const emailError = validateEmail(input.email)
  if (emailError) return { ok: false, error: `Your email: ${emailError}` }

  const studentEmailRaw = input.studentEmail.trim()
  if (studentEmailRaw) {
    const studentEmailError = validateEmail(studentEmailRaw)
    if (studentEmailError) {
      return { ok: false, error: `Student email: ${studentEmailError}` }
    }
  }

  const counselorError = validateEmail(input.counselorEmail)
  if (counselorError) {
    return { ok: false, error: `Counselor email: ${counselorError}` }
  }

  const email = normalizeEmail(input.email)
  const studentEmail = studentEmailRaw ? normalizeEmail(studentEmailRaw) : null
  const counselorEmail = normalizeEmail(input.counselorEmail)

  if (counselorEmail === email || counselorEmail === studentEmail) {
    return {
      ok: false,
      error:
        'The counselor email should be the school counselor\u2019s address, not yours.',
    }
  }

  if (!input.consent) {
    return {
      ok: false,
      error: 'Please check the consent box so we can contact the counselor.',
    }
  }

  const supabase = createServiceClient()

  const { count: recent } = await supabase
    .from('eligibility_applications')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString())
  if (recent && recent > 0) {
    return {
      ok: false,
      error:
        'We already got an application from this email in the last few minutes. Hang tight, we\u2019re on it.',
    }
  }

  const { data: application, error: insertError } = await supabase
    .from('eligibility_applications')
    .insert({
      student_name: studentName,
      parent_name: parentName,
      email,
      student_email: studentEmail,
      grade,
      school,
      eligibility_type: input.eligibilityType,
      counselor_email: counselorEmail,
      consent_at: new Date().toISOString(),
    })
    .select('id')
    .single<{ id: string }>()

  if (insertError || !application) {
    console.error('[access] eligibility insert failed:', insertError)
    return {
      ok: false,
      error:
        'We couldn\u2019t save your application. Please try again, or email dario@getpupil.com.',
    }
  }

  const emailSent = await notifyCounselorOfEligibilityApplication({
    counselorEmail,
    familyEmails: studentEmail ? [email, studentEmail] : [email],
    parentName,
    studentName,
    grade,
    school,
  }).catch((err) => {
    console.error('[access] counselor email failed:', err)
    return false
  })

  if (emailSent) {
    await supabase
      .from('eligibility_applications')
      .update({ counselor_emailed_at: new Date().toISOString() })
      .eq('id', application.id)
  }

  await captureServerEvent(`eligibility_application:${application.id}`, 'eligibility_application_submitted', {
    eligibility_type: input.eligibilityType,
    counselor_emailed: emailSent,
    $process_person_profile: false,
  })

  return { ok: true, emailSent }
}

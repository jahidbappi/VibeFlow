import { saveFormRequest, saveMessage } from './api/supabase'

export async function submitProjectRequest(values) {
  const [requestId, messageId] = await Promise.all([
    saveFormRequest(values),
    saveMessage({
      name: values.name,
      email: values.email,
      subject: `Project request: ${values.service}`,
      message: [
        `Service: ${values.service}${values.subcategory ? ` → ${values.subcategory}` : ''}`,
        `Budget: ${values.budget}`,
        '',
        values.description,
      ].join('\n'),
    }),
  ])

  return { requestId, messageId, saved: Boolean(requestId || messageId) }
}

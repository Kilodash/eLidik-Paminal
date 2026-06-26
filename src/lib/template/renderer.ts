export function renderTemplateHtml(html: string, variables: Record<string, string>) {
  let result = html
  // Sederhana: mengganti placeholder seperti {{ key }} dengan value
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value)
  }
  return result
}

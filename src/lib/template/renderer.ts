export function renderTemplateHtml(html: string, variables: Record<string, string>): string {
  let result = html
  for (const [key, value] of Object.entries(variables)) {
    const escaped = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\\n/g, '<br/>')
      .replace(/\n/g, '<br/>')
    result = result.replaceAll(`{{${key}}}`, escaped)
    result = result.replaceAll(`{{ ${key} }}`, escaped)
  }
  return result
}

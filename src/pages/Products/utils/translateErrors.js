export const errorTranslationMap = {
  'This field is required.': 'This field is required.',
  'This field may not be blank.': 'This field may not be blank.',
  'This field may not be null.': 'This field may not be null.',
  'Enter a valid number.': 'Enter a valid number.',
  'A valid integer is required.': 'A valid integer is required.',
  'Ensure this field has at least': 'Ensure this field has at least',
  'Ensure this field has no more than': 'Ensure this field has no more than',
  'Enter a valid URL.': 'Enter a valid URL.',
  'Enter a valid email address.': 'Enter a valid email address.',
  'List may not be empty.': 'List may not be empty.',
  'Enter a number.': 'Enter a number.',
  'Ensure this value has at least': 'Ensure this value has at least',
  'Ensure this value has no more than': 'Ensure this value has no more than',
  'Object with id=': 'Invalid id',
}

export function translateMessages(messages) {
  return messages.map((msg) => {
    for (const [en, fa] of Object.entries(errorTranslationMap)) {
      if (msg.includes(en))
        return msg.replace(en, fa)
    }

    return msg
  })
}

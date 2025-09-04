export const formatCategoryName = (category: string | null): string => {
  if (!category) return ''
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

export const parseDetailedCategory = (primaryCategory: string | null, detailedCategory: string | null): string => {
  if (!detailedCategory || !primaryCategory) {
    return formatCategoryName(primaryCategory || detailedCategory)
  }

  const formattedPrimary = formatCategoryName(primaryCategory)
  const formattedDetailed = formatCategoryName(detailedCategory)

  // If detailed category starts with primary category, extract the specific part
  if (detailedCategory.startsWith(primaryCategory)) {
    const specificPart = detailedCategory.substring(primaryCategory.length)
    if (specificPart.startsWith('_')) {
      const formattedSpecific = formatCategoryName(specificPart.substring(1))
      if (formattedSpecific) {
        return `${formattedPrimary}: ${formattedSpecific}`
      }
    }
  }

  // If they're the same, just return the primary
  if (primaryCategory === detailedCategory) {
    return formattedPrimary
  }

  // If detailed doesn't start with primary, show both separately
  return formattedDetailed
}
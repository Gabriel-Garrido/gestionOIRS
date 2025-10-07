import Button from './Button'

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.ceil(totalItems / pageSize)

  if (totalPages <= 1) return null

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1)
  }

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1)
  }

  const renderPageNumbers = () => {
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <Button
          key={i}
          type="button"
          size="sm"
          variant={i === currentPage ? 'primary' : 'outline'}
          onClick={() => onPageChange(i)}
        >
          {i}
        </Button>
      )
    }
    return pages
  }

  return (
    <div className="flex items-center justify-center gap-2 p-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handlePrevious}
        disabled={currentPage === 1}
      >
        Anterior
      </Button>
      {renderPageNumbers()}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleNext}
        disabled={currentPage === totalPages}
      >
        Siguiente
      </Button>
    </div>
  )
}

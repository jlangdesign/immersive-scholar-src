// This function removes overflow elements from a matrix at set media queries to ensure that the number of elements in each row and column are equal
function columnResizeOnAspectChange (container, elements) {
  const aspect1 = window.matchMedia('(max-aspect-ratio: 58/21)')
  const aspect2 = window.matchMedia('(max-aspect-ratio: 68/21)')
  aspect1.addListener(addRemoveColumns)
  aspect2.addListener(addRemoveColumns)

  function addRemoveColumns (event) {
    const style = window.getComputedStyle(container)
    const numColumns = style.getPropertyValue('grid-template-columns')
      .split(' ').length
    const numElementsOverflow = elements.length % numColumns

    elements.forEach(function (element, i) {
      if (i > elements.length - numElementsOverflow - 1) {
        element.classList.add('removed')
      } else {
        element.classList.remove('removed')
      }
    })
  }

  addRemoveColumns(aspect1)
  addRemoveColumns(aspect2)
}

export default columnResizeOnAspectChange

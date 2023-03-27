import './style.scss'
import { sample, shuffle } from 'lodash'
import rawImgData from './data.csv'

// Our minimum height for a "large-scale display"
const minLargeHeight = 2100
// Variables for running timed transitions on large-scale displays
let timedTransitions = true
const timeBetweenOverlay = 30000
// timeOverlayShown is adjusted this based on the # of slides in a series
let timeOverlayShown = 0
const timeSlideShown = 30000 // 30s
let timedOverlay
// Maximum number of slides/images in a series' slideshow
const maxSlides = 9
// Timeout variable for slide duration
let slideshow
// Duration for which title and description overlays remain visible
const titleTime = 3000 // 3s
const descTime = 60000 // 60s or 1 min
// Visualization Wall width and height
const visWallWidth = 3840
const visWallHeight = 1518
// Line with codedglass.com URL to append to end of each window description
const lastLine = ' Find out more at '
const url = '<a id="slide-url" href="https://www.codedglass.com/" target="_blank" rel="noopener noreferrer">www.codedglass.com</a>.'

// Name of the folder containing the image assets, must be located in 'src' folder
const imgFolder = `images`
const imgData = rawImgData

const matrix = document.querySelector('.matrix')

// This function takes in an image source path and a title to create an img element with alt-text. It returns the created img element.
const createImgElement = function (imgSrc, title) {
  const img = document.createElement('img')
  img.src = require(`./${imgFolder}/${imgSrc}`)
  img.alt = title
  return img
}

// An array containing the image elements of the matrix
let shuffledMatrix
let matrixImgs

/**
 * Shuffles the image data and appends the matrix items to the matrix.
 */
function setMatrix () {
  // Add contents to matrix variables
  shuffledMatrix = shuffle(imgData)
  matrixImgs = shuffledMatrix.map(d => createImgElement(d.imgName, d.title))

  // Append matrix images to the matrix container with links
  matrixImgs.forEach(function (img, i) {
    img.className = 'matrix-item-img'
    img.dataset.pos = i
    let a = document.createElement('a')
    a.href = shuffledMatrix[i].url
    a.className = 'matrix-item'
    let name = document.createElement('h1')
    name.innerHTML = shuffledMatrix[i].title
    name.className = 'matrix-item-name'
    // TODO re-add hover states (title appears on pink overlay)
    // a.appendChild(name)
    // a.appendChild(img)
    img.addEventListener('click', runImageOverlay)
    matrix.appendChild(img)
  })
}

// Load the images into the matrix
setMatrix()

/**
 * Starts the display of an image overlay by setting the src of img element
 * (class="overlay-image") to the source of the specific user selected image
 * or of a randomly selected image from an automated, timed selection.
 */
function runImageOverlay (event) {
  // This function should only be run when the overlay is hidden
  if (!overlayImgContainer.classList.contains('hidden')) { return }

  // If the image was clicked on, choose this image
  // Else (timed transitions are toggled), choose a random image that hasn't
  // been 'viewed' yet
  let currentSeries = event ? this : sample(matrixImgs.filter(d =>
    !d.classList.contains('removed') && !('viewed' in d.dataset))
  )

  // Set viewed data option of element to true to prevent repeating of series when in timed mode
  currentSeries.dataset.viewed = true
  // If all series have been viewed, remove viewed data option to start fresh
  if (matrixImgs.filter(d => !('viewed' in d.dataset)).length === 0) {
    matrixImgs.forEach(d => delete d.dataset.viewed)
  }

  // Set the content of the title and desc overlays
  let titleText = document.getElementById('slide-title')
  let descText = document.querySelector('.slide-desc-text')
  titleText.innerHTML = shuffledMatrix[currentSeries.dataset.pos].title
  descText.innerHTML = shuffledMatrix[currentSeries.dataset.pos].desc + lastLine + url

  // Make overlay visible
  overlayImgContainer.classList.remove('hidden')

  // Remove title overlay after delay
  const titleOverlay = document.querySelector('.slide-title-container')
  titleOverlay.classList.remove('hidden')
  window.setTimeout(function () {
    titleOverlay.classList.add('hidden')
  }, titleTime) // 3s

  // Remove desc after delay
  const descOverlay = document.querySelector('.slide-desc-overlay')
  descOverlay.classList.remove('hidden')
  window.setTimeout(function () {
    descOverlay.classList.add('hidden')
  }, descTime) // 60s or 1min

  /**
   * Sets or changes the image that is being zoomed and panned in the overlay.
   * Used in a loop to view all of the images in a window series.
   */
  function setImg (overlayImg) {
    // Set content of overlay-img and its pan-zoom animation
    // let overlayImg = document.querySelector('.overlay-img')
    // overlayImg.src = url
    const offsetX = Math.random() * overlayImg.width - overlayImg.width / 2
    const offsetY = Math.random() * overlayImg.height - overlayImg.height / 2
    const offsetZ = Math.random() * 500 + 500
    overlayImg.style.setProperty('--offsetX', offsetX + 'px')
    overlayImg.style.setProperty('--offsetY', offsetY + 'px')
    overlayImg.style.setProperty('--offsetZ', offsetZ + 'px')
    overlayImg.classList.add('pan-zoom')
  }

  // Loads the urls of the slides of the series into an array from data.csv
  let currentData = shuffledMatrix[currentSeries.dataset.pos]
  // TODO generalize this (only load if not empty/not null)
  let slideDeck = [
    currentData.slide1,
    currentData.slide2,
    currentData.slide3,
    currentData.slide4,
    currentData.slide5,
    currentData.slide6,
    currentData.slide7,
    currentData.slide8,
    currentData.slide9
  ]

  // Get calculate number of slides in series
  // Also get time overlay should be shown for this series
  let numSlides = 0
  for (let j = 0; j < maxSlides; j++) {
    if (slideDeck[j] !== '') {
      numSlides++
    }
  }
  timeOverlayShown = numSlides * timeSlideShown

  // Declare variables to use in showSlide()
  let imgSrc
  let nextImgSrc
  // let imgURL
  let i = 0
  let topImg = document.getElementById('top-img')
  let bottomImg = document.getElementById('bottom-img')

  /**
   * Shows each slide in the slideshow via recursive calls.
   */
  function showSlide () {
    if (i >= numSlides) {
      // Exit function so it doesn't continue
      timeOverlayShown = 0
      window.clearInterval(slideshow)
      return
    }

    // Get image url
    imgSrc = slideDeck[i]
    // imgURL = require(`./${imgFolder}/${imgSrc}`)

    // Set the overlay image and make it zoom and pan
    // document.querySelector('.overlay-img').classList.remove('pan-zoom')
    document.querySelectorAll('.overlay-img').forEach(function (d) {
      d.classList.remove('pan-zoom')
    })
    // setImg(imgURL)

    // Set the image underneath the overlay image (the next image in the
    // series) for a smoother transition
    if (i < numSlides - 1) {
      nextImgSrc = slideDeck[i + 1]
      // bottomImg.src = require(`./${imgFolder}/${nextImgSrc}`)
      if (i === 0) {
        topImg.src = require(`./${imgFolder}/${imgSrc}`)
      }

      // TODO get fade transitions to work
      if (i % 2 === 0) {
        bottomImg.src = require(`./${imgFolder}/${nextImgSrc}`)
        bottomImg.classList.add('hidden')
        topImg.classList.remove('hidden')
        setImg(topImg)
      } else {
        topImg.src = require(`./${imgFolder}/${nextImgSrc}`)
        topImg.classList.add('hidden')
        bottomImg.classList.remove('hidden')
        setImg(bottomImg)
      }
    } else {
      bottomImg.src = ''
    }

    // Increment to next index
    i++

    // Play slideshow recursively
    slideshow = setTimeout(showSlide, timeSlideShown)
  }

  // Start the slideshow
  showSlide()

  // If overlay was made visible via a click event, prevent the
  // 'closeImageOverlay' event attached to body from being thrown
  if (event) {
    timedTransitions = false
    event.stopPropagation()
    window.clearTimeout(timedOverlay)
  } else {
    window.clearTimeout(timedOverlay)
    timedOverlay = window.setTimeout(closeImageOverlay, timeOverlayShown)
  }
}

// Enables closing of image overlay if a click occurs within image overlay container, class="image-select-overlay"
const overlayImgContainer = document.querySelector('.overlay-img-container')
overlayImgContainer.addEventListener('click', closeImageOverlay)

/**
 * Closes the overlay by making it "hidden."
 */
function closeImageOverlay (event) {
  // Return if click occured on top of the codedglass.com URL in the desc overlay
  if (event && event.path.includes(overlayImgContainer) &&
    event.path.includes(document.querySelector('#slide-url'))) { return }

  overlayImgContainer.classList.add('hidden')

  // Adds an event listener to overlayImgContainer to delay the removal of the 'pan-zoom' class and prevent the last image from appearing to 'jump'
  const delayedPanZoomReset = () => {
    document.querySelector('.overlay-img')
      .classList.remove('pan-zoom')
    overlayImgContainer.removeEventListener('transitioned', delayedPanZoomReset)
  }
  // Add event listener to remove 'pan-zoom' after div is hidden
  overlayImgContainer.addEventListener('transitioned', delayedPanZoomReset)

  // Timeout and interactive events
  window.clearTimeout(timedOverlay)
  // Make sure slideshow stops playing if it is ended early
  window.clearTimeout(slideshow)
  if (!event) { timedOverlay = window.setTimeout(runImageOverlay, timeBetweenOverlay) }
}

// If the display is a (non-interactive) large-scale display, toggle timed
// transitions/animations
if (timedTransitions) { timedOverlay = window.setTimeout(runImageOverlay, timeBetweenOverlay) }

/******************************************************************************/
//                      Specs for personal-sized devices                      //
/******************************************************************************/

// Keyboard shortcuts for convenience
window.addEventListener('keydown', function (event) {
  if (event.keyCode === 27) { // Esc key
    document.querySelector('.overlay-img-container').click()
  }
}, true)

/**
 * Conditions to check when the window is resized.
 * TODO changes need to be undone when reverting back to original size
 */
window.onresize = function () {
  /**
   * Appends imm-sch-url-container to the main-txt in desktop and laptop displays.
   * This allows the Immersive Scholar footer to scroll along with the main text
   * in personal-sized displays with a short height so the user can see both
   * elements. Also sets the footer's position to sticky so it will stick to the
   * bottom of the main-txt column when there is extra space.
   */
  if (window.innerHeight < minLargeHeight && window.innerWidth > 768 &&
    !(window.innerWidth === visWallWidth && window.innerHeight === visWallHeight)) {
    let immSchURL = document.getElementsByClassName('imm-sch-url-container')[0]
    document.getElementsByClassName('main-txt')[0].appendChild(immSchURL)
    immSchURL.style.position = 'sticky'
    immSchURL.style.top = minLargeHeight + 'px'
    immSchURL.style.padding = '40px 0px 0px 0px'
  }

  // /**
  //  * Appends main-url to the end of main-desc for improved reading flow in
  //  * large-scale displays with an aspect ratio of 5/7 or narrower.
  //  */
  // if (window.innerWidth / window.innerHeight <= 5 / 7 && window.innerHeight >= minLargeHeight) {
  //   let mainURL = document.getElementsByClassName('main-url')[0]
  //   document.getElementsByClassName('main-desc')[0].appendChild(mainURL)
  // }
}

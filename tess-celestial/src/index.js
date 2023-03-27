import './style.scss'
import { sample, shuffle } from 'lodash'
import columnResize from './columnResize.js'
import matrixZoomAnimation from './matrixZoomAnimation.js'
import rawImgData from './data.csv'

// Name of the folder containing the image assets, must be located in 'src' folder
const imgFolder = `images`
const imgData = rawImgData
// Our minimum height for a "large-scale display"
// (Since we're not designing for the Visualization Wall anyway)
const minLargeHeight = 2100
// Variables for timed transitions and zoom animation speed, timed transitions will be set if 'timedTransitions' is 'true'
let zoomSpeed = 8000 // 8 sec for zoom in/out animation
// Time for new popup content to fade in after being changed (delay)
let contentSwapSpeed = 300
let timedTransitions = true
let isVisWall = false
const timeBetweenPopup = 30000 + zoomSpeed // 30 sec in full matrix view
const timePopupShown = 60000 + zoomSpeed // 60 sec in popup view
let timedPopup

// FOR TESTING: copy imgData multiple times to populate matrix
// const imgPadding = 21 - imgData.length
// for (let i = 0; i < imgPadding; i++) {
//   imgData.push(sample(rawImgData))
// }

const matrix = document.querySelector('.matrix')

/**
 * This function takes in an image source path and a title to create an img
 * element with alt-text. It returns the created img element.
 */
const createImgElement = function (imgSrc, title) {
  const img = document.createElement('img')
  img.src = require(`./${imgFolder}-small/${imgSrc}`)
  img.alt = title
  img.dataset.id = title.split(' ').join('')
  // Set seperate sources for full matrix view (smallSrc) and the current image used in the zoom and popup window (bigSrc). These are switched on show/remove popup
  img.dataset.bigSrc = require(`./${imgFolder}/${imgSrc}`)
  img.dataset.smallSrc = require(`./${imgFolder}-small/${imgSrc}`)
  return img
}

// An array containing the image elements of the matrix
const matrixImgs = shuffle(imgData).map(d => createImgElement(d.imgName, d.title))

// Append matrix images to the matrix container
matrixImgs.forEach(function (img, i) {
  img.className = 'matrix-item'
  img.dataset.pos = i
  matrix.appendChild(img)
})

// TODO assetsObject Key is obsolete with new data format!!!!!!!
/**
 * This function takes in an array of objects with key names specified in
 * 'data.csv' and returns an object with keys of 'title' and values of relative
 * popup assets.
 */
const preparePopupAssets = function (assetsObject, value) {
  assetsObject[value.title.split(' ').join('')] = {
    title: value.title,
    text: value.storyText,
    storyMedia: [
      value.storyMedia1,
      value.storyMedia2,
      value.storyMedia3,
      value.storyMedia4
    ]
  }

  return assetsObject
}

const popupAssets = imgData.reduce(preparePopupAssets, {})

/**
 * Fades an element in.
 */
const fadeIn = function (element) {
  element.style.transition = 'opacity 0.3s ease-in-out 0s'
  element.style.opacity = 1
}

/**
 * Fades an element out.
 */
const fadeOut = function (element) {
  element.style.transition = 'opacity 0.3s ease-in-out 0s'
  element.style.opacity = 0
}

/**
 * This function displays a story popup window and assigns the content of that
 * window based on data bound to the activated matrix img.
 */
const showPopup = function (event) {
  const storyPopup = document.querySelector('.matrix-popup')

  // If a story popup is already visible, prevent a new popup from being displayed
  if (storyPopup.classList.contains('visible')) { return }

  // Set 'currentStory' to clicked matrix img element or random selection of images that have not been removed from the display if timed event
  let currentStory = event ? this : sample(matrixImgs.filter(d =>
    !d.classList.contains('removed') && !('viewed' in d.dataset))
  )

  // Keep track of current scroll position (to revert to when exiting popup)
  let scrollPos = window.pageYOffset

  // Keep track of content of item that was originally clicked on so
  // removePopup() won't have an error after popup content has been changed
  const originalStory = currentStory

  // Set viewed data option of element to true to prevent repeating of stories when in timed mode
  currentStory.dataset.viewed = true
  // If all stories have been viewed remove viewed data option to start fresh
  if (matrixImgs.filter(d => !('viewed' in d.dataset)).length === 0) {
    matrixImgs.forEach(d => delete d.dataset.viewed)
  }

  /**
   * This function sets the story content (image sources, primary image,
   * secondary images, title, and text) in a popup.
   */
  const setStoryContent = function () {
    // Switch src to higher resolution image for zoom
    currentStory.src = currentStory.dataset.bigSrc

    let storyId = currentStory.dataset.id
    let story = popupAssets[storyId]

    // Set source of main img to img selected from matrix
    document.getElementById('primary-popup-img').src = currentStory.src

    // Add pattern columns to the left and right of the popup
    if (isVisWall) {
      let patternUrl = 'url(' + currentStory.src + ')'
      document.getElementById('pattern-1').style.backgroundImage = patternUrl
      document.getElementById('pattern-2').style.backgroundImage = patternUrl
    }

    // Set array of 'secondary' img elements from popup and make sure to remove any previously used images
    let secondaryImgs = document.querySelectorAll('.secondary-img')
    secondaryImgs.forEach(d => d.classList.add('removed'))

    // Filter story media to display available secondary images
    story.storyMedia
      .filter(d => d !== '')
      .forEach(function (mediaItem, i) {
        secondaryImgs[i].classList.remove('removed')
        secondaryImgs[i].src = require(`./${imgFolder}/${mediaItem}`)
        secondaryImgs[i].id = 'secondary-img-' + i
      })

    // Set the title and text of the story popup
    document.querySelector('.project-title').textContent = story.title
    document.querySelector('.project-story').textContent = story.text
  }

  // Set the story content for the item that was clicked on
  setStoryContent()

  // Zoom in on selected element (currentStory) in the matrix and display popup (storyPopup) after animation completes
  matrixZoomAnimation(matrix, currentStory, storyPopup, 'zoom-in', zoomSpeed)
  // Deactivate matrix item hover state and put it behind all other elements
  document.querySelector('.matrix').style.zIndex = '-1'

  /**
   * This function changes the popup to the previous/next matrix-item
   * if the left or right arrow buttons were clicked.
   */
  const swapStory = function (event) {
    // Prevent swapping before popup is even fully visible
    // (Must be zoomed in in popup mode before attempting to exit)
    if (!storyPopup.classList.contains('visible')) { return }

    if (event && event.path.includes(storyPopup) &&
      event.path.includes(document.querySelector('#prev-button'))) {
      if (+currentStory.dataset.pos === 0) {
        currentStory = matrixImgs[+matrixImgs.length - 1]
      } else {
        currentStory = matrixImgs[+currentStory.dataset.pos - 1]
      }
      setStoryContent()
    } else if (event && event.path.includes(storyPopup) &&
      event.path.includes(document.querySelector('#next-button'))) {
      if (+currentStory.dataset.pos === +matrixImgs.length - 1) {
        currentStory = matrixImgs[0]
      } else {
        currentStory = matrixImgs[+currentStory.dataset.pos + 1]
      }
      setStoryContent()
    }
  }

  /**
   * This function swaps the primary-img with the secondary-img that was clicked
   * on (the secondary-img is now the primary-img, and vice versa).
   */
  const swapImg = function (event) {
    // Prevent swapping before popup is even fully visible
    // (Must be zoomed in in popup mode before attempting to exit)
    if (!storyPopup.classList.contains('visible')) { return }

    // Grab original hover transitions of the images
    // so they can be reset after the transition
    let temp1 = document.getElementById('primary-popup-img').style.transition
    let temp2 = this.style.transition

    // Fade out original images
    fadeOut(document.getElementById('primary-popup-img'))
    fadeOut(this)

    // Grab the ID of "this" to be used in fadeIn()
    let thisElem = document.getElementById(this.id)

    setTimeout(function () {
      // The source swapping occurs here because it should happen after the
      // original images fade out, not before
      let temp = document.getElementById('primary-popup-img').src
      document.getElementById('primary-popup-img').src = thisElem.src
      thisElem.src = temp

      // Fade in new images
      fadeIn(thisElem)
      fadeIn(document.getElementById('primary-popup-img'))

      // Reset hover transitions
      document.getElementById('primary-popup-img').style.transition = temp1
      thisElem.style.transition = temp2
    }, contentSwapSpeed)
  }

  /**
   * This function removes the popup from the screen when a click occurs
   * anywhere on the screen except on top of the open popup.
   */
  const removePopup = function (event) {
    // Return if click occured on top of the popup and not on the close button
    if (event && event.path.includes(storyPopup) &&
      !event.path.includes(document.querySelector('#close-button'))) { return }

    // Prevent popup from being removed before it is even fully visible
    // (Must be zoomed in in popup mode before attempting to exit)
    if (!storyPopup.classList.contains('visible')) { return }

    // Revert to original story to avoid error in matrixZoomAnimation
    currentStory = originalStory

    // Zoom out of selected element (currentStory) in the matrix and remove popup (storyPopup) before animation completes
    matrixZoomAnimation(matrix, currentStory, storyPopup, 'zoom-out', zoomSpeed)
    // Hide popup (doesn't disappear quickly enough if inside of matrixZoomAnimation())
    storyPopup.classList.remove('visible')
    document.querySelector('.overlay').classList.remove('visible')
    // Reactivate matrix item hover state
    document.querySelector('.matrix').style.zIndex = '1'

    // Remove EventListeners so they don't build up and fire multiple times
    for (let i = 0; i < document.querySelectorAll('.secondary-img').length; i++) {
      document.querySelectorAll('.secondary-img')[i].removeEventListener('click', swapImg, true)
    }
    document.querySelector('body').removeEventListener('click', removePopup)
    document.querySelector('#close-button').removeEventListener('click', removePopup)
    document.querySelector('#prev-button').removeEventListener('click', swapStory)
    document.querySelector('#next-button').removeEventListener('click', swapStory)

    // Timeout and interactive events
    window.clearTimeout(timedPopup)
    if (!event) { timedPopup = window.setTimeout(showPopup, timeBetweenPopup) }
    // Return to original scroll position
    window.scrollTo(0, scrollPos)
  }

  // If popup was made visible via a click event, prevent the 'removePopup' event attached to body from being thrown
  if (event) {
    event.stopPropagation()
    window.clearTimeout(timedPopup)
  } else {
    window.clearTimeout(timedPopup)
    timedPopup = window.setTimeout(removePopup, timePopupShown)
  }

  // Attach event listeners to the body and close-button to close the popup if
  // they are clicked
  document.querySelector('body').addEventListener('click', removePopup)
  document.querySelector('#close-button').addEventListener('click', removePopup)

  // Attach event listeners to prev-button and next-button to swap the popup
  // content if they are clicked without having to leave popup view
  document.querySelector('#prev-button').addEventListener('click', swapStory)
  document.querySelector('#next-button').addEventListener('click', swapStory)

  // Attach event listeners to each secondary-img to swap the primary-img with
  // the secondary-img that is clicked
  for (let i = 0; i < document.querySelectorAll('.secondary-img').length; i++) {
    document.querySelectorAll('.secondary-img')[i].addEventListener('click', swapImg, true)
  }
}

// Attach an event listener to each matrix img to show popup on click
matrixImgs.forEach(d =>
  d.addEventListener('click', showPopup)
)

/***********************************************************************/
/***********************************************************************/
/** Conditions for personal-sized displays and the Visualization Wall **/
/***********************************************************************/
/***********************************************************************/
// Check if this is the Visualization Wall
if (window.innerHeight === 1518 && window.innerWidth === 3840) {
  isVisWall = true
}

// Attach event listeners for keyboard for convenience
window.addEventListener('keydown', function (event) {
  if (event.keyCode === 37) { // Left arrow key
    document.querySelector('#prev-button').click()
  } else if (event.keyCode === 39) { // Right arrow key
    document.querySelector('#next-button').click()
  } else if (event.keyCode === 27) { // Esc key
    document.querySelector('#close-button').click()
  }
}, true)

// Turn off auto (timed) transitions if on a personal-sized (interactive) display
// and adjust zoom speed accordingly
if (window.innerHeight < minLargeHeight && !isVisWall) {
  timedTransitions = false
  if (window.innerWidth <= 425) { // Mobile
    zoomSpeed = 2000
  } else if (window.innerWidth <= 768) { // Tablet
    zoomSpeed = 4000
  } else { // Larger than tablet (laptop, desktop, etc.)
    zoomSpeed = 6000
  }
}

// Adds pattern columns for the Visualization Wall display
if (isVisWall) {
  let pattern1 = document.createElement('div')
  let pattern2 = document.createElement('div')
  pattern1.classList.add('pattern')
  pattern2.classList.add('pattern')
  pattern1.id = 'pattern-1'
  pattern2.id = 'pattern-2'
  document.querySelector('.matrix-popup').appendChild(pattern1)
  document.querySelector('.matrix-popup').appendChild(pattern2)
}

// If the display is a (non-interactive) large-scale display, toggle timed
// transitions/animations
if (timedTransitions) { timedPopup = window.setTimeout(showPopup, timeBetweenPopup) }

// This function removes overflow images from the matrix at media breakpoints to ensure every row has an equal number of columns given a matrix with 'x' grid columns and 'y' images
columnResize(matrix, matrixImgs)

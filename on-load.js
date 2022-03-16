// Config
const LOGIN_URL = 'https://www.mryum.com/cpc-testing-ho/dine-in'

const ZAPIER_ON_LOAD_WEB_HOOK_URL = 'https://hooks.zapier.com/hooks/catch/1729573/bsm6fk7/'

const ZAPIER_STUDENT_OR_KEY_WORKER_TIER_UPDATE_WEB_HOOK_URL = null

const ZAPIER_REQUIRES_ACTIVATION_WEB_HOOK_URL = null

const API_URL = 'https://eu1-stable-api.mryum.com/graphql'

const API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzNTY5YmFhZi0wNzk1LTRjMGUtYWRhMy0wZjVjYzA1YTBmNjYiLCJzdWIiOiIxMDM5ODRjZi0wZmM2LTQwMTMtYWMxMC03MmViMDdkZDM0YjYiLCJpYXQiOjE2NDY4NjMyMzEsImlzcyI6Imh0dHBzOi8vZXUxLXByb2R1Y3Rpb24tc3RhYmxlLWFwaS5tcnl1bS5jb20iLCJhdWQiOiJodHRwczovL2V1MS1wcm9kdWN0aW9uLXN0YWJsZS1hcGkubXJ5dW0uY29tIiwiZXhwIjoxNjc4Mzk5MjMxfQ.MDTXIszIVWhmbPmplmoRQ6Mv8gMBxk34KRt3vKFfZl0'

// end of Config

/**
 * Script runs on page load.
 */

console.log('activation testing that popups does not reload - 2')

let tierChangedToStudentOrStaff = false

let graphApi = graphql(`${API_URL}`, {
  asJSON: true,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`
  },
  fragments: {
    member: `on GuestMembership {
        name,
        email,
        mobile,
        points,
        tier
      }`
  }
})

init()

document.getElementById('close-activated-modal').addEventListener('click', function () {
  Cookies.set('activation', false, { expires: 365 })
})

// Internal methods

/**
 * Initializes the page.
 */
async function init () {
  showLoader()

  await setCookiesFromUrl().then(() => {
    if (!isReferred()) {
      hideLoader()
      // redirect to login
      window.location.href = LOGIN_URL
    } else {
      retrieveAndSetGuestMembership().then(() => {
        initDesign().then(() => {
          hideLoader()
        })
      })
    }
  })
}

/**
 * Initializes the design and styles based on current user.
 *
 * @return {Promise<void>}
 */
async function initDesign () {
  // Check the cookie value for tier
  // If the value matches takes Header background and tier text elements and changes their color.
  // The elements with the tier names as IDs are stars next to the tier name. They are all hidden, but if the tier matches then it displays the star with the appropriate color. So if the colors are changed, a new star has to be uploaded with that color.

  if (requiresActivation) {
    showActivationModal()
  }

  const tier = Cookies.get('tier')

  if (tier === 'GUEST') {

    document.getElementById('header-bg').style.backgroundColor = '#bee6b7'
    document.getElementById('tier').style.color = '#CDECC8'
    document.getElementById('guest').style.display = 'block'

  } else if (tier === 'LOCAL') {

    document.getElementById('header-bg').style.backgroundColor = '#d6f2ea'
    document.getElementById('tier').style.color = '#AEE5D7'
    document.getElementById('local').style.display = 'block'

  } else if (tier === 'REGULAR') {

    document.getElementById('header-bg').style.backgroundColor = '#fadad8'
    document.getElementById('tier').style.color = '#F1A4A0'
    document.getElementById('regular').style.display = 'block'

  } else if (tier === 'FRIEND') {

    document.getElementById('header-bg').style.backgroundColor = '#fbe89d'
    document.getElementById('tier').style.color = '#F6D13B'
    document.getElementById('friend').style.display = 'block'

  } else if (tier === 'FAMILY') {

    document.getElementById('header-bg').style.backgroundColor = '#cbe2cc'
    document.getElementById('tier').style.color = '#A5D0AD'
    document.getElementById('family').style.display = 'block'

  } else if (tier === 'NHS') {

    document.getElementById('keyworker-outer').style.display = 'block'

  } else if (tier === 'STUDENT') {

    document.getElementById('student-outer').style.display = 'block'
  }
}

/**
 * Sets the initial cookies from the URL parameters.
 *
 * @return {Promise<unknown>}
 */
async function setCookiesFromUrl () {
  return await new Promise((resolve, reject) => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('guest_id')) {
      Cookies.set('guestId', urlParams.get('guest_id'), { expires: 365 })
    }
    if (urlParams.has('venue_id')) {
      Cookies.set('venueId', urlParams.get('venue_id'), { expires: 365 })
    }
    if (urlParams.has('activation') && (urlParams.get('activation') === 'true' || urlParams.get('activation') === true)) {
      if (!Cookies.get('activation')) {
        Cookies.set('activation', true, { expires: 365 })
      }
    } else {
      Cookies.set('activation', false, { expires: 365 })
    }
    resolve()
  })
}

/**
 * Sets the guest membership data in cookies.
 * @return {Promise<void>}
 */
async function retrieveAndSetGuestMembership () {

  return await new Promise((resolve, reject) => {
    retrieveGuestMembership().then(member => {

      setMemberCookies(member).then(() => {
        triggerWebHook(ZAPIER_ON_LOAD_WEB_HOOK_URL, true).then(() => {
          if (tierChangedToStudentOrStaff) {
            triggerWebHook(ZAPIER_STUDENT_OR_KEY_WORKER_TIER_UPDATE_WEB_HOOK_URL, true)
          }
          if (Cookies.get('activation') === true) {
            triggerWebHook(ZAPIER_REQUIRES_ACTIVATION_WEB_HOOK_URL, false)
          }
          resolve()
        }).catch(() => {
          reject()
        })
      }).catch(() => {
        reject()
      })
    }).catch(() => {
      reject()
    })
  })
}

/**
 * Resolves the values and sets the member's cookies accordingly.
 *
 * @param member
 * @return {Promise<unknown>}
 */
async function setMemberCookies (member) {

  return await new Promise((resolve, reject) => {

    const tier = resolveTier(member)
    let limitParticipation = false
    let visitType = 'FIRST'

    Cookies.set('clubPoints', member.points, { expires: 365 })
    Cookies.set('tier', tier, { expires: 365 })
    Cookies.set('name', member.name, { expires: 365 })
    Cookies.set('email', member.email, { expires: 365 })
    Cookies.set('mobile', member.mobile, { expires: 365 })
    Cookies.set('limit_participation', limitParticipation, { expires: 365 })
    Cookies.set('visit_type', visitType, { expires: 365 })
    resolve()
  })
}

/**
 * Resolves the tier.
 *
 * @param member
 * @return {string}
 */
function resolveTier (member) {

  const emailAddress = member.email.toLowerCase()
  let tier = member.tier

  if (!tier) {
    if (emailAddress.includes('.nhs.uk')) {
      tier = 'NHS'
      tierChangedToStudentOrStaff = true
    } else if (emailAddress.includes('.ac.uk')) {
      tier = 'STUDENT'
      tierChangedToStudentOrStaff = true
    }
  }

  if (tier !== 'STUDENT' && tier !== 'NHS' && tier !== 'STAFF') {
    const points = member.points
    if (points > -1 && points < 1000) {
      tier = 'GUEST'
    } else if (points > 999 && points < 2500) {
      tier = 'LOCAL'
    } else if (points > 2500 && points < 5000) {
      tier = 'REGULAR'
    } else if (points > 5000 && points < 10000) {
      tier = 'FRIEND'
    } else if (points > 9999) {
      tier = 'FAMILY'
    }
  }

  return tier
}

/**
 * Triggers the given webhook with guest membership data.
 * @param webhookUrl
 * @param sendIfFirstVisitOnly
 * @return {Promise<unknown>}
 */
async function triggerWebHook (webhookUrl, sendIfFirstVisitOnly = false) {
  return await new Promise((resolve, reject) => {
    if (webhookUrl !== null) {

      if (sendIfFirstVisitOnly && !isFirstVisit()) {
        resolve()
      } else {
        axios.create(
          {
            transformRequest: [(data, _headers) => JSON.stringify(data)]
          }
        ).post(
          webhookUrl,
          {
            guestId: Cookies.get('guestId'),
            venueId: Cookies.get('venueId'),
            clubPoints: Cookies.get('clubPoints'),
            tier: Cookies.get('tier'),
            name: Cookies.get('name'),
            email: Cookies.get('email'),
            mobile: Cookies.get('mobile'),
            limitParticipation: Cookies.get('limit_participation'),
            activation: Cookies.get('activation'),
            visitType: Cookies.get('visit_type'),
          },
          { headers: { 'Accept': 'application/json' } }
        ).then(() => {
          resolve()
        }).catch(() => {
          reject()
        })
      }
    } else {
      resolve()
    }
  })
}

/**
 * Determines if this is the first visit for the guest.
 * @return {boolean}
 */
function isFirstVisit () {

  return Cookies.get('visit_type') === 'FIRST'
}

/**
 * Retrieves the guest membership from the API.
 */
async function retrieveGuestMembership () {
  let member = graphApi(`query ($guestId: ID!) {
        guestMembership(guestId: $guestId){ ...member }
      }`)

  return await new Promise((resolve, reject) => {
    member({
      guestId: Cookies.get('guestId')
    }).then(response => {
      resolve(response.guestMembership)
    }).catch(errors => {
      reject(errors)
    })
  })

}

/**
 * Determines if the user has been referred by another site
 *
 * @return {boolean}
 */
function isReferred () {
  return Cookies.get('guestId')
}

/**
 * Shows the page loader
 */
function showLoader () {
  document.getElementById('loader-outer').style.display = 'block'
}

/**
 * Hides the page loader
 */
function hideLoader () {
  document.getElementById('loader-outer').style.display = 'none'
}

function showActivationModal () {
  document.getElementById('activated-outer').style.display = 'block'
}

// ---- end of snippet ---

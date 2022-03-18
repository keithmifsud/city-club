/**
 * Microsite scripts.
 */

/** Configuration **/

const LOGIN_URL = 'https://www.mryum.com/cpc-testing-ho/dine-in'

const ZAPIER_ON_LOAD_WEB_HOOK_URL = 'https://hooks.zapier.com/hooks/catch/1729573/bsm6fk7/'

const ZAPIER_STUDENT_OR_KEY_WORKER_TIER_UPDATE_WEB_HOOK_URL = null

const ZAPIER_REQUIRES_ACTIVATION_WEB_HOOK_URL = null

const API_URL = 'https://eu1-stable-api.mryum.com/graphql'

const API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzNTY5YmFhZi0wNzk1LTRjMGUtYWRhMy0wZjVjYzA1YTBmNjYiLCJzdWIiOiIxMDM5ODRjZi0wZmM2LTQwMTMtYWMxMC03MmViMDdkZDM0YjYiLCJpYXQiOjE2NDY4NjMyMzEsImlzcyI6Imh0dHBzOi8vZXUxLXByb2R1Y3Rpb24tc3RhYmxlLWFwaS5tcnl1bS5jb20iLCJhdWQiOiJodHRwczovL2V1MS1wcm9kdWN0aW9uLXN0YWJsZS1hcGkubXJ5dW0uY29tIiwiZXhwIjoxNjc4Mzk5MjMxfQ.MDTXIszIVWhmbPmplmoRQ6Mv8gMBxk34KRt3vKFfZl0'

/** ./Configuration **/

/** State **/

const state = {
  guestId: null,
  venueId: null,
  activation: false,
  visitType: false,
  clubPoints: null,
  tier: null,
  name: null,
  email: null,
  mobile: null,
  limitParticipation: false,
  tierChangedToStudentOrStaff: false,
}

const getAllState = (asString = false) => {
  if (asString) {
    return JSON.stringify(state)
  }
  return state
}

const getState = (propertyName) => {
  return state[propertyName]
}

const setState = (propertyName, value, setCookie = true) => {
  state[propertyName] = value
  Cookies.set('state', state,)
  if (setCookie) {
    Cookies.set(propertyName, value, { expires: 365 })
  }
}

function isReferred () {
  return getState('guestId') !== null
}

function tierChangedToStudentOrStaff() {
  return getState('tierChangedToStudentOrStaff')
}

function requiresActivation() {
  return getState('activation')
}

async function initialiseState () {
  return await new Promise((resolve) => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('guest_id')) {
      setState('guestId', urlParams.get('guest_id'))
    }
    if (urlParams.has('venue_id')) {
      setState('venueId', urlParams.get('venue_id'))
    }
    if (urlParams.has('activation')) {https://city-club-members.webflow.io/?tiers-and-venues=regular
      setState('activation', true)
    }

    if (Cookies.get('visitType')) {
      if (Cookies.get('visitType') === 'FIRST') {
        setState('visitType', 'RETURNING')
      }
    } else {
      setState('visitType', 'FIRST')
    }
    resolve()
  })
}


async function setMemberState(member) {
  return await new Promise(resolve => {
    setState('clubPoints', member.points)
    setState('tier', resolveTier(member))
    setState('name', member.name)
    setState('email', member.email)
    setState('mobile', member.mobile)
    setState('limitParticipation', false)
    resolve()
  })
}


/** State **/

/** Initialization **/

async function initMicroSite () {
  return await new Promise((resolve, reject) => {
    showLoader()
    initialiseState().then(() => {
      if (!isReferred()) {
        hideLoader()
        resolve()
        window.location.href = LOGIN_URL
      } else {
        getMember().then(member => {
          setMemberState(member).then(() => {
            triggerWebHook(
              ZAPIER_ON_LOAD_WEB_HOOK_URL,
              true
            ).then(() => {
              if (tierChangedToStudentOrStaff()) {
                triggerWebHook(
                  ZAPIER_STUDENT_OR_KEY_WORKER_TIER_UPDATE_WEB_HOOK_URL,
                  true
                ).then(() => {
                  resolve()
                })
              } else{
                resolve()
              }
            }).then(() => {
              if (requiresActivation()) {
                triggerWebHook(
                  ZAPIER_REQUIRES_ACTIVATION_WEB_HOOK_URL,
                  false
                ).then(() => {
                  hideLoader()
                  showActivationModal()
                })
              }
            })
          }).then(() => {
            hideLoader()
            resolve()
          })
        })
      }
      // ....
    }).catch(errors => {
      reject(errors)
    })
  })
}

initMicroSite()

/** ./Initialization **/

/** API client **/

/**
 * Init the API client.
 */
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

async function getMember () {
  const member = graphApi(`query ($guestId: ID!) {
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

/** ./API client **/

/** Internal methods **/

/**
 * Resolves the member's tier.
 *
 * @param member
 * @return {*|null}
 */
function resolveTier(member) {
  const emailAddress = member.email.toLowerCase()
  let tier = member.tier

  if (!tier) {
    if (emailAddress.includes('.nhs.uk')) {
      tier = 'NHS'
       setState('tierChangedToStudentOrStaff', true, false)
    } else if (emailAddress.includes('.ac.uk')) {
      tier = 'STUDENT'
      setState('tierChangedToStudentOrStaff', true, false)
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
          getAllState(),
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


/** ./Internal methods **/

/** Rendering **/

function renderDesign () {

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
  document.getElementById('close-activated-modal').addEventListener('click', function () {
    setState('activation', false)
  })
}

/** ./Rendering **/

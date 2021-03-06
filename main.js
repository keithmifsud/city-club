/**
 * Microsite scripts.
 */

/** Configuration **/

const LOGIN_URL = 'https://www.mryum.com/damsonandwilde/membership/loyalty'

/*const LOGIN_URL = 'https://www.mryum.com/cpc-testing-ho/membership/loyalty'*/

const ZAPIER_ON_LOAD_WEB_HOOK_URL = 'https://hooks.zapier.com/hooks/catch/1729573/bsm6fk7/'

const ZAPIER_STUDENT_OR_KEY_WORKER_TIER_UPDATE_WEB_HOOK_URL = 'https://hooks.zapier.com/hooks/catch/1729573/bszxf8j/'

const ZAPIER_REQUIRES_ACTIVATION_WEB_HOOK_URL = 'https://hooks.zapier.com/hooks/catch/1729573/bszxjw2/'

const ZAPIER_2000_POINTS_WEBHOOK_URL = 'https://zapier.com/app/history/001a6425-1b0b-af69-9917-990ff722b7d1'

const ZAPIER_DEDUCT_POINTS_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/1729573/bsnmsqi/'

const API_URL = 'xxx'

const API_TOKEN = 'xxx'

const TIERS = [
  'GUEST',
  'LOCAL',
  'REGULAR',
  'FRIEND',
  'FAMILY',
  'NHS',
  'STUDENT'
]

/** ./Configuration **/

/** State **/

const state = {
  guestId: null,
  venueId: null,
  activation: false,
  visitType: null,
  clubPoints: null,
  tier: null,
  name: null,
  email: null,
  mobile: null,
  limitParticipation: false,
  tierChangedToStudentOrStaff: false,
  venueName: null,
  totalPointsAccrued: null,
}

const getAllState = (asString = false) => {
  if (asString) {
    return JSON.stringify(state)
  }

  if (getState('guestId') === null) {
    setState('guestId', Cookies.get('guestId'))
  }

  if (getState('venueId') === null) {
    setState('venueId', Cookies.get('venueId'))
  }

  if (getState('venueName') === null) {
    setState('venueName', Cookies.get('venueName'))
  }

  if (getState('visitType') === null) {
    setState('visitType', Cookies.get('visitType'))
  }

  if (getState('clubPoints') === null) {
    setState('clubPoints', Cookies.get('clubPoints'))
  }

  if (getState('tier') === null) {
    setState('tier', Cookies.get('tier'))
  }

  if (getState('name') === null) {
    setState('name', Cookies.get('name'))
  }

  if (getState('email') === null) {
    setState('email', Cookies.get('email'))
  }

  if (getState('mobile') === null) {
    setState('mobile', Cookies.get('mobile'))
  }

  if (getState('totalPointsAccrued') === null) {
    setState('totalPointsAccrued', Cookies.get('totalPointsAccrued'))
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

function shouldHideStartOrderingButton () {

  let hide = false

  let invalidVenueId = Cookies.get('venueId') === undefined ||
    Cookies.get('venueId') === undefined ||
    Cookies.get('venueId') === null

  let invalidVenueName = Cookies.get('venueName') === null

  let testingVenue = false

  if (Cookies.get('venueName') !== null && Cookies.get('venueName') !== undefined) {
    testingVenue = Cookies.get('venueName').includes('cpc-testing-ho')
  }

  hide =  (invalidVenueId && invalidVenueName) || testingVenue

  console.log('invalid venue id:', invalidVenueId)
  console.log('invalid venue name:', invalidVenueName)
  console.log('is testing site:', testingVenue )
  console.log('hide?', hide )


  return hide
}

function tierChangedToStudentOrStaff () {
  return getState('tierChangedToStudentOrStaff')
}

function requiresActivation () {
  return getState('activation')
}

function isFirstVisit () {
  return getState('visitType') === 'FIRST'
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

    if (urlParams.has('return_uri')) {
      setState('venueName', decodeURIComponent(urlParams.get('return_uri')))
    }

    if (urlParams.has('activation')) {
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

async function setMemberState (member) {
  return await new Promise(resolve => {
    setState('clubPoints', member.points)
    setState('tier', resolveTier(member))
    setState('name', member.name)
    setState('email', member.email)
    setState('mobile', member.mobile)
    setState('limitParticipation', false)
    setState('totalPointsAccrued', member.totalPointsAccrued)
    resolve()
  })
}

async function setStateFromCookies () {
  return await new Promise(resolve => {
    setState('guestId', Cookies.get('guestId'))
    setState('venueId', Cookies.get('venueId'))
    setState('visitType', Cookies.get('visitType'))
    setState('clubPoints', Cookies.get('clubPoints'))
    setState('tier', Cookies.get('tier'))
    setState('name', Cookies.get('name'))
    setState('email', Cookies.get('email'))
    setState('mobile', Cookies.get('mobile'))
    setState('limitParticipation', Cookies.get('limit_participation'))
    setState('totalPointsAccrued', Cookies.get('totalPointsAccrued'))
    resolve()
  })
}

/** State **/

/** Initialization **/

async function initMicroSite () {
  return await new Promise((resolve, reject) => {
    hideAllTierStars()
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

              const memberClubPoints = getState('clubPoints')
              if (memberClubPoints !== null) {
                if (parseInt(memberClubPoints) >= 2000) {
                  triggerWebHook(
                    ZAPIER_2000_POINTS_WEBHOOK_URL,
                    false
                  )
                }
              }

              if (tierChangedToStudentOrStaff()) {
                triggerWebHook(
                  ZAPIER_STUDENT_OR_KEY_WORKER_TIER_UPDATE_WEB_HOOK_URL,
                  false
                ).then(() => {
                  resolve()
                })
              } else {
                resolve()
              }
            }).then(() => {
              if (requiresActivation() && !getState('tierChangedToStudentOrStaff')) {
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
            if (shouldHideStartOrderingButton()) {
              document.getElementById('start-ordering-button').style.display = 'none'
              document.getElementById('home-back-button').style.display = 'none'
            }
            hideLoader()
            resolve()
          })
        })
      }

    }).catch(errors => {
      reject(errors)
    })
  })
}

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
        tier,
        totalPointsAccrued
      }`,
  }
})

async function getMember () {
/*  const member = graphApi(`query ($guestId: ID!) {
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
  })*/

  return await new Promise((resolve, reject) => {
    axios.get(
      `https://club.damsonandwilde.co.uk/api/guest?guestId=${Cookies.get('guestId')}`
    ).then(member => {
      // ..do something with member but first console log it out to understand the format difference.

      console.log('Retrieved member', member)
    }).catch(errors => {
      console.log('God forbids, connection issues:', errors)
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
function resolveTier (member) {
  const emailAddress = member.email.toLowerCase()
  let tier = member.tier

  if (!tier || tier === 'null') {
    if (emailAddress.includes('.nhs.uk')) {
      tier = 'NHS'
      setState('tierChangedToStudentOrStaff', true, false)
    } else if (emailAddress.includes('.ac.uk')) {
      tier = 'STUDENT'
      setState('tierChangedToStudentOrStaff', true, false)
    }

    if (tier !== 'STUDENT' && tier !== 'NHS' && tier !== 'STAFF') {
      const points = member.totalPointsAccrued
      if (points > -1 && points < 1000) {
        tier = 'GUEST'
      } else if (points > 999 && points < 2500) {
        tier = 'LOCAL'
      } else if (points >= 2500 && points < 5000) {
        tier = 'REGULAR'
      } else if (points >= 5000 && points < 10000) {
        tier = 'FRIEND'
      } else if (points > 9999) {
        tier = 'FAMILY'
      }
    }
  } else if (tier !== 'STUDENT' && tier !== 'NHS' && tier !== 'STAFF') {
    const points = member.totalPointsAccrued
    if (points > -1 && points < 1000) {
      tier = 'GUEST'
    } else if (points > 999 && points < 2500) {
      tier = 'LOCAL'
    } else if (points >= 2500 && points < 5000) {
      tier = 'REGULAR'
    } else if (points >= 5000 && points < 10000) {
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
        axios.create().get(
          webhookUrl,
          {
            params: getAllState()
          },
        ).then(() => {
          resolve()
        }).catch(errors => {
          console.log('caught here:', errors)
          reject()
        })
      }
    } else {
      resolve()
    }
  })
}

async function deductPoints (points, promoName) {
  return await new Promise((resolve, reject) => {

    axios.create(
      {
        transformRequest: [(data, _headers) => JSON.stringify(data)]
      }
    ).post(
      ZAPIER_DEDUCT_POINTS_WEBHOOK_URL,
      {
        guestId: Cookies.get('guestId'),
        pointsToDeduct: points,
        promoName: promoName,
      },
      { headers: { 'Accept': 'application/json' } }
    ).then(() => {
      getMember().then(member => {
        setMemberState(member).then(() => {
          resolve()
        })
      })
    }).catch(() => {
      reject()
    })
  })
}

function capitalizeFirstLetter (word) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

/**
 * Listens to the CTA buttons' click.
 */
function listenToBannersCtaClick () {
  const ctas = document.querySelectorAll('.c-button-l')
  ctas.forEach(cta => {
    cta.addEventListener('click', function handleClick (event) {
      event.preventDefault()
      const bannerCta = event.currentTarget.attributes.href.nodeValue
      const bannerCtaWebhook = bannerCta.substring(bannerCta.indexOf('=') + 1)
      if (bannerCtaWebhook.length > 0) {
        triggerWebHook(decodeURIComponent(bannerCtaWebhook)).then(() => {
          deductPoints(
            Cookies.get('promoPoints'),
            Cookies.get('promoName')
          )
        })
      }
    })
  })
}

/** ./Internal methods **/

/** Rendering **/

function renderDesign () {

  styleHeader()
  fillContent()
  const tier = getState('tier')
  if (tier === 'NHS' && getState('tierChangedToStudentOrStaff') === true && getState('activation') !== true) {
    document.getElementById('keyworker-outer').style.display = 'block'
  }
  if (tier === 'STUDENT' && getState('tierChangedToStudentOrStaff') === true && getState('activation') !== true) {
    document.getElementById('student-outer').style.display = 'block'
  }
}

function fillContent () {
  let points = getState('clubPoints')
  if (points === null) {
    points = 0
  }
  const pointsContent = document.getElementById('points')
  pointsContent.innerText = points.toLocaleString()

  const tierContent = document.getElementById('tier')

  let tier = getState('tier')

  if (tier !== 'NHS') {
    tier = capitalizeFirstLetter(tier)
  }
  tierContent.innerText = tier
}

function styleHeader () {
  hideAllTierStars()
  const tier = getState('tier')
  let headerBackgroundColour = '#A4B39E'
  let tierColour = '#527162'
  switch (tier) {
    case 'LOCAL':
      headerBackgroundColour = '#A4B39E'
      tierColour = '#527162'
      break
    case 'REGULAR':
      headerBackgroundColour = '#A4B39E'
      tierColour = '#527162'
      break
    case 'FRIEND':
      headerBackgroundColour = '#A4B39E'
      tierColour = '#527162'
      break
    case 'FAMILY':
      headerBackgroundColour = '#A4B39E'
      tierColour = '#527162'
      break
    default:
      headerBackgroundColour = '#A4B39E'
      tierColour = '#527162'
  }

  document.getElementById('header-bg').style.backgroundColor = headerBackgroundColour
  document.getElementById('tier').style.color = tierColour
  showTierStar(tier)
}

function hideAllTierStars () {
  TIERS.forEach(tier => {
    let star = document.getElementById(tier.toLowerCase())
    if (star !== null) {
      star.style.display = 'none'
    }
  })
}

function showTierStar (tier) {
  let star = document.getElementById(tier.toLowerCase())
  if (star !== null) {
    star.style.display = 'block'
  } else if (tier === 'NHS' || tier === 'STUDENT') {
    star = document.getElementById('guest')
    star.style.display = 'block'
  }
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
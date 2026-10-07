/**
 * Self-care steps written as crew procedures. They are things an astronaut can do on board
 * and when to bring the flight surgeon in. They never replace the flight surgeon's judgement.
 */
export interface Protocol {
  title: string
  steps: string[]
  escalate: string
}

const PMC = 'Raise it at your next private medical conference.'

export const PROTOCOLS: Record<string, Protocol> = {
  sleepHours: {
    title: 'Protect the next sleep period',
    steps: [
      'Check the sleep station: light leaks, noise, airflow and temperature.',
      'Keep screens and bright light away for the last hour before sleep.',
      'Ask the ground to hold the full sleep period clear of tasks.',
      'Avoid caffeine in the last six hours before sleep.',
    ],
    escalate: `Three short nights in a row, or work errors you notice in yourself: ${PMC.toLowerCase()}`,
  },
  sleepQuality: {
    title: 'Find what is breaking up your sleep',
    steps: [
      'Note when you woke and why: noise, cold, thoughts, need to void.',
      'Keep wake time steady even after a bad night.',
      'Do a short wind-down routine you can repeat every night.',
    ],
    escalate: `Poor sleep that lasts most of a week: ${PMC.toLowerCase()}`,
  },
  mood: {
    title: 'Check in with yourself and someone else',
    steps: [
      'Book a call with family or a friend in the next free window.',
      'Pick one thing you enjoy and put it in tomorrow’s schedule.',
      'Tell one crewmate how you are doing. Short is fine.',
    ],
    escalate: 'Low mood on most days for a week, or any thoughts of self-harm: talk to the flight surgeon or the behavioral health team today.',
  },
  stress: {
    title: 'Lower the load you can control',
    steps: [
      'Write down the two tasks causing the most pressure.',
      'Ask the ground to re-plan or split one of them.',
      'Take a real break: window time, music, or exercise without a timer.',
    ],
    escalate: `High stress that does not ease after re-planning: ${PMC.toLowerCase()}`,
  },
  connected: {
    title: 'Close the distance',
    steps: [
      'Schedule a personal call or video message home.',
      'Share a meal with the crew and leave work out of it.',
      'Ask the support team for news, photos or messages from home.',
    ],
    escalate: 'Feeling cut off for several days running: speak with the behavioral health team.',
  },
  reactionMs: {
    title: 'Treat slower reactions as a fatigue signal',
    steps: [
      'Repeat the vigilance test after a rest or at your usual time tomorrow.',
      'Move critical tasks such as robotics or vehicle operations to after a full sleep.',
      'Look at your sleep log for the last three nights.',
    ],
    escalate: `Slower than baseline for three days: ${PMC.toLowerCase()} and tell the lead for any critical task.`,
  },
  lapses: {
    title: 'Treat attention lapses as a fatigue signal',
    steps: [
      'Repeat the vigilance test after rest.',
      'Use a second crewmate check on critical steps today.',
      'Look at your sleep log for the last three nights.',
    ],
    escalate: `More lapses for three days: ${PMC.toLowerCase()}`,
  },
  restingHr: {
    title: 'Recheck your resting heart rate',
    steps: [
      'Measure again after five quiet minutes, before caffeine or exercise.',
      'Check for fever, poor sleep or dehydration, which all raise resting rate.',
      'Drink to your hydration plan.',
    ],
    escalate: `Still outside your baseline on recheck, or with chest pain, palpitations or breathlessness: contact the flight surgeon now.`,
  },
  systolic: {
    title: 'Recheck your blood pressure',
    steps: [
      'Sit still for five minutes, arm supported, then measure twice one minute apart.',
      'Log the lower of the two readings.',
      'Note headache or vision change alongside it.',
    ],
    escalate: 'Above the hypertensive range on recheck, or with headache, vision change or chest pain: contact the flight surgeon now.',
  },
  diastolic: {
    title: 'Recheck your blood pressure',
    steps: [
      'Sit still for five minutes, arm supported, then measure twice one minute apart.',
      'Log the lower of the two readings.',
    ],
    escalate: 'Above the hypertensive range on recheck: contact the flight surgeon.',
  },
  temperature: {
    title: 'Fever: limit spread and report',
    steps: [
      'Recheck temperature in an hour.',
      'Wipe shared surfaces you touched and keep your own cup and towel separate.',
      'Rest and drink to your hydration plan.',
    ],
    escalate: 'Any fever of 38.0 °C or higher: contact the flight surgeon today.',
  },
  symptoms: {
    title: 'Log and contain immune symptoms',
    steps: [
      'Photograph any rash or lip blister with the date so changes can be compared.',
      'Wash hands before meals and after hygiene, and avoid sharing personal items.',
      'Note which symptoms started first and when.',
    ],
    escalate: 'Two or more symptoms together, symptoms that last past three days, or any eye symptom: contact the flight surgeon.',
  },
  exerciseMin: {
    title: 'Get back on your exercise plan',
    steps: [
      'Book the missed session into the next free slot.',
      'If time is the problem, ask the ground for a schedule change. Resistive work matters most for bone.',
      'If pain stopped you, log where and how bad.',
    ],
    escalate: 'Missed sessions over several days, or pain that stops exercise: tell the exercise specialist and flight surgeon.',
  },
  bodyMass: {
    title: 'Look at intake and exercise together',
    steps: [
      'Compare meals eaten against your plan for the last three days.',
      'Weigh at the same time of day for the next readings.',
      'Check your exercise log: loss with missed sessions means muscle at risk.',
    ],
    escalate: 'Steady loss over two weeks: review with the nutrition team and flight surgeon.',
  },
  backPain: {
    title: 'Ease back pain',
    steps: [
      'Use the knees-to-chest position for a few minutes; many crew find it helps early in flight.',
      'Keep foot restraints and work stations adjusted to your body.',
      'Note if pain spreads to the legs or brings numbness.',
    ],
    escalate: 'Pain that spreads, numbness or weakness: contact the flight surgeon now.',
  },
  headache: {
    title: 'Track the headache',
    steps: [
      'Note the time, where it hurts, and what you were doing.',
      'Check cabin carbon dioxide readings with the crew; high CO₂ is a known trigger.',
      'Drink to your hydration plan and take a break from screens.',
    ],
    escalate: 'Severe headache, headache with vision change, or one that does not ease: contact the flight surgeon.',
  },
  nearVision: {
    title: 'Report the vision change',
    steps: [
      'Note which eye and what changed: near text, distance, or both.',
      'Try the adjustable glasses if they are in your kit.',
      'Keep a daily note of whether it gets better or worse.',
    ],
    escalate: 'Any new vision change goes to the flight surgeon. Eye checks may be added to your schedule.',
  },
}

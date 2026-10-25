// One clock for every moving specimen, shared by the shaders and the guided steps.
const T0 = performance.now()
export const specimenTime = () => (performance.now() - T0) / 1000

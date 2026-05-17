export type SimulationMode = 'career' | 'baselineCalibration' | 'liveVisitCalibration'

export const SIMULATION_MODE = {
  career: 'career',
  baselineCalibration: 'baselineCalibration',
  liveVisitCalibration: 'liveVisitCalibration',
} as const satisfies Record<SimulationMode, SimulationMode>
export interface TodaysWorkoutResult {
  found: boolean;
  day?: string;
  date?: Date;
  training?: string;
  description?: string;
  plannedTSS?: number;
  actualTSS?: number;
  effectiveTSS?: number;
  fitness?: number;
  fatigue?: number;
  form?: number;
  weekNumber?: string;
  weekOf?: string;
  status?: 'before' | 'after' | 'unknown';
}

export function estimateTSS(training: string, description: string): number {
  if (training.toLowerCase() === 'rest' || training.toLowerCase().includes('travel')) {
    return 0;
  }

  if (training.toLowerCase().includes('x-train') || training.toLowerCase() === 'x-train') {
    return 22.5;
  }

  const miles = parseFloat(training);
  if (!isNaN(miles) && miles > 0) {
    const desc = description.toLowerCase();
    const hardKeywords = ['hard', 'threshold', 'tempo', '10k', '5k', 'vo2', 'fast', 'hills', 'ladder'];
    const moderateKeywords = ['aerobic', 'hm effort', 'race pace', 'fartlek'];

    const isHard = hardKeywords.some(keyword => desc.includes(keyword));
    const isModerate = moderateKeywords.some(keyword => desc.includes(keyword)) && !isHard;

    if (desc.includes('up,') || desc.includes('down') || desc.includes('easy,')) {
      if (isHard) {
        return Math.round(miles * 0.3 * 8 + miles * 0.7 * 11);
      } else if (isModerate) {
        return Math.round(miles * 0.3 * 8 + miles * 0.7 * 9.5);
      }
    }

    if (isHard) {
      return Math.round(miles * 11);
    } else if (isModerate) {
      return Math.round(miles * 9.5);
    } else {
      return Math.round(miles * 8);
    }
  }

  if (description.toLowerCase().includes('50k')) {
    return 350;
  }
  if (description.toLowerCase().includes('100k')) {
    return 600;
  }

  return 0;
}

export function getTodaysWorkout({
  data,
  planStartDate,
  initialFitness,
  initialFatigue,
  actualTSSData
}: {
  data: any[];
  planStartDate: Date;
  initialFitness: number;
  initialFatigue: number;
  actualTSSData: Record<string, number>;
}): TodaysWorkoutResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentFitness = initialFitness;
  let currentFatigue = initialFatigue;

  for (let i = 0; i < data.length; i += 2) {
    const weekRow = data[i];
    const descriptionRow = data[i + 1];

    if (!weekRow || !descriptionRow) continue;

    const weekIndex = Math.floor(i / 2);
    const weekStartDate = new Date(planStartDate);
    weekStartDate.setDate(planStartDate.getDate() + weekIndex * 7);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      const day = days[dayIndex];
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + dayIndex);
      dayDate.setHours(0, 0, 0, 0);

      const training = weekRow[day] || '';
      const description = descriptionRow[day] || '';
      const plannedTSS = estimateTSS(training, description);
      const workoutKey = `${weekIndex}-${dayIndex}`;
      const actualTSS = actualTSSData[workoutKey];
      const effectiveTSS = actualTSS ?? plannedTSS;

      const fitnessAlpha = 2 / (42 + 1);
      const fatigueAlpha = 2 / (7 + 1);

      currentFitness = currentFitness + fitnessAlpha * (effectiveTSS - currentFitness);
      currentFatigue = currentFatigue + fatigueAlpha * (effectiveTSS - currentFatigue);

      const form = currentFatigue > 0 ? (currentFitness - currentFatigue) / currentFitness : 0;

      if (dayDate.getTime() === today.getTime()) {
        return {
          found: true,
          day,
          date: dayDate,
          training,
          description,
          plannedTSS,
          actualTSS,
          effectiveTSS,
          fitness: currentFitness,
          fatigue: currentFatigue,
          form,
          weekNumber: weekRow['Week #'] || '',
          weekOf: weekStartDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
        };
      }
    }
  }

  const planStart = new Date(planStartDate);
  planStart.setHours(0, 0, 0, 0);

  if (today < planStart) return { found: false, status: 'before' };

  const totalWeeks = Math.ceil(data.length / 2);
  const planEnd = new Date(planStartDate);
  planEnd.setDate(planStartDate.getDate() + totalWeeks * 7 - 1);
  planEnd.setHours(0, 0, 0, 0);

  if (today > planEnd) return { found: false, status: 'after' };

  return { found: false, status: 'unknown' };
}

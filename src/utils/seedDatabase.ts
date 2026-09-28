import { 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase';
import { wards, tankers, incidents, demandHistory, forecastWards, citizenBadges, leaderboard } from '../data/mockData';
import { allUsers } from '../data/users';
import { waterStressedZones, tankerLogistics, regulatoryCompliance, wardForecastInputs } from '../data/BengaluruCrisisFeed';

/**
 * Seeding script to populate Firestore with initial demo data.
 * This should be run once to set up the database environment.
 */
export async function seedDatabase() {
  console.log('Starting database seeding...');
  const batch = writeBatch(db);

  try {
    // 1. Seed Users
    console.log('Seeding users...');
    for (const user of allUsers) {
      const userRef = doc(db, 'users', user.id);
      batch.set(userRef, user);
    }

    // 2. Seed Wards
    console.log('Seeding wards...');
    for (const ward of wards) {
      const wardRef = doc(db, 'wards', ward.id);
      batch.set(wardRef, ward);
    }

    // 3. Seed Tankers
    console.log('Seeding tankers...');
    for (const tanker of tankers) {
      const tankerRef = doc(db, 'tankers', tanker.id);
      batch.set(tankerRef, tanker);
    }

    // 4. Seed Incidents
    console.log('Seeding incidents...');
    for (const incident of incidents) {
      const incidentRef = doc(db, 'incidents', incident.id);
      batch.set(incidentRef, incident);
    }

    // 5. Seed Forecast Wards
    console.log('Seeding forecastWards...');
    for (const ward of forecastWards) {
      const forecastRef = doc(db, 'forecastWards', ward.id);
      batch.set(forecastRef, ward);
    }

    // 6. Seed Demand History (Stats)
    console.log('Seeding stats/demandHistory...');
    const statsRef = doc(db, 'stats', 'demandHistory');
    batch.set(statsRef, { data: demandHistory });

    // 7. Seed Citizen Badges (Global/Metadata)
    console.log('Seeding metadata/badges...');
    const badgesRef = doc(db, 'metadata', 'citizenBadges');
    batch.set(badgesRef, { badges: citizenBadges });

    // 8. Seed Leaderboard
    console.log('Seeding metadata/leaderboard...');
    const leaderboardRef = doc(db, 'metadata', 'leaderboard');
    batch.set(leaderboardRef, { scores: leaderboard });

    // 9. Seed Analytics / Crisis Feed
    console.log('Seeding analytics/crisisFeed...');
    const crisisRef = doc(db, 'analytics', 'crisisFeed');
    batch.set(crisisRef, { 
      waterStressedZones, 
      tankerLogistics, 
      regulatoryCompliance 
    });

    // 10. Seed Analytics / Forecast Inputs
    console.log('Seeding analytics/forecastInputs...');
    const forecastInputsRef = doc(db, 'analytics', 'forecastInputs');
    batch.set(forecastInputsRef, { data: wardForecastInputs });

    await batch.commit();
    console.log('Database seeded successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, error };
  }
}

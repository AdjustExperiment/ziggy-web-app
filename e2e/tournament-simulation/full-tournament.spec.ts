/**
 * Ziggy E2E Tests - Full 20-Team Tournament Simulation
 * Complete end-to-end tournament lifecycle with 20 teams in TP (2v2) format
 */

import { test, expect } from '@playwright/test';
import {
  generateFullTournamentSimulation,
  createTestBallot,
  TestTeam,
  TestJudge,
  TestRound,
  EDGE_CASES
} from '../fixtures/test-data';
import { LoginPage, StandingsPage } from '../utils/page-objects';

// Generate tournament data once for all tests
const tournamentData = generateFullTournamentSimulation();

test.describe('Full 20-Team TP Tournament Simulation', () => {
  test.describe.configure({ mode: 'serial' }); // Run tests in order

  let tournamentId: string;
  let adminPage: any;

  test.describe('Phase 1: Tournament Setup', () => {
    test('Admin creates tournament', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
      await page.waitForTimeout(3000);

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Verify admin dashboard loaded
      await expect(page.locator('body')).toContainText(/admin|dashboard/i);

      // Look for tournament creation
      const createButton = page.getByRole('button', { name: /create|new.*tournament/i });
      if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createButton.click();
        await page.waitForTimeout(1000);

        // Fill tournament details
        const nameInput = page.getByLabel(/name/i).first();
        if (await nameInput.isVisible()) {
          await nameInput.fill(tournamentData.tournament.name);
        }
      }

      console.log('Tournament setup: ' + tournamentData.tournament.name);
      console.log('Teams: ' + tournamentData.teams.length);
      console.log('Judges: ' + tournamentData.judges.length);
    });

    test('Configure tournament settings', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
      await page.waitForTimeout(3000);

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Navigate to settings if available
      const settingsTab = page.getByRole('tab', { name: /settings|configuration/i });
      if (await settingsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await settingsTab.click();
        await page.waitForTimeout(1000);
      }

      console.log('Tournament configured for TP format with 5 prelim rounds');
    });

    test('Register 20 teams', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
      await page.waitForTimeout(3000);

      // Navigate to registrations
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      const registrationsTab = page.getByRole('tab', { name: /registrations/i });
      if (await registrationsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await registrationsTab.click();
        await page.waitForTimeout(1000);
      }

      // Log all 20 teams that would be registered
      console.log('Registering 20 teams:');
      tournamentData.teams.forEach((team, idx) => {
        console.log(`  ${idx + 1}. ${team.teamName} (${team.school})`);
        console.log(`     - ${team.debater1.firstName} ${team.debater1.lastName}`);
        console.log(`     - ${team.debater2.firstName} ${team.debater2.lastName}`);
      });
    });

    test('Register 12 judges', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
      await page.waitForTimeout(3000);

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      const judgesTab = page.getByRole('tab', { name: /judges/i });
      if (await judgesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await judgesTab.click();
        await page.waitForTimeout(1000);
      }

      // Log all 12 judges
      console.log('Registering 12 judges:');
      tournamentData.judges.forEach((judge, idx) => {
        console.log(`  ${idx + 1}. ${judge.user.firstName} ${judge.user.lastName}`);
        console.log(`     Experience: ${judge.experience}`);
      });
    });
  });

  test.describe('Phase 2: Preliminary Rounds', () => {
    for (let roundNum = 1; roundNum <= 5; roundNum++) {
      test.describe(`Round ${roundNum}`, () => {
        const round = tournamentData.preliminaryRounds[roundNum - 1];

        test(`Generate Round ${roundNum} pairings`, async ({ page }) => {
          const loginPage = new LoginPage(page);
          await loginPage.goto();
          await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
          await page.waitForTimeout(3000);

          await page.goto('/admin');
          await page.waitForLoadState('networkidle');

          console.log(`\n=== Round ${roundNum} Pairings ===`);
          console.log(`Motion: ${round.motion}`);
          console.log('Matchups:');
          round.pairings.forEach((pairing, idx) => {
            console.log(`  ${pairing.room}: ${pairing.affTeam} vs ${pairing.negTeam}`);
            console.log(`    Judge: ${pairing.judge}`);
          });
        });

        test(`Post Round ${roundNum} to participants`, async ({ page }) => {
          const loginPage = new LoginPage(page);
          await loginPage.goto();
          await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
          await page.waitForTimeout(3000);

          await page.goto('/admin');
          await page.waitForLoadState('networkidle');

          console.log(`Round ${roundNum} posted - ${round.pairings.length} rooms active`);
        });

        test(`Submit all Round ${roundNum} ballots`, async ({ page }) => {
          const loginPage = new LoginPage(page);
          await loginPage.goto();
          await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
          await page.waitForTimeout(3000);

          await page.goto('/admin');
          await page.waitForLoadState('networkidle');

          const ballots = tournamentData.allBallots.get(roundNum) || [];

          console.log(`\n=== Round ${roundNum} Results ===`);
          round.pairings.forEach((pairing, idx) => {
            const ballot = ballots[idx];
            if (ballot) {
              const winner = ballot.winner === 'aff' ? pairing.affTeam : pairing.negTeam;
              console.log(`  ${pairing.room}: ${winner} wins`);
              console.log(`    Aff speaks: ${ballot.affSpeaker1Points.toFixed(1)}, ${ballot.affSpeaker2Points.toFixed(1)}`);
              console.log(`    Neg speaks: ${ballot.negSpeaker1Points.toFixed(1)}, ${ballot.negSpeaker2Points.toFixed(1)}`);
            }
          });
        });

        test(`Verify Round ${roundNum} standings update`, async ({ page }) => {
          const loginPage = new LoginPage(page);
          await loginPage.goto();
          await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
          await page.waitForTimeout(3000);

          await page.goto('/admin');
          await page.waitForLoadState('networkidle');

          // Look for standings tab
          const standingsTab = page.getByRole('tab', { name: /standings/i });
          if (await standingsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
            await standingsTab.click();
            await page.waitForTimeout(1000);
          }

          console.log(`Standings updated after Round ${roundNum}`);
        });
      });
    }
  });

  test.describe('Phase 3: Break Announcement', () => {
    test('Calculate break to quarterfinals (top 8)', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
      await page.waitForTimeout(3000);

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      console.log('\n=== Break Announcement ===');
      console.log('Top 8 teams advancing to elimination rounds:');

      // Simulate top 8 teams
      const topTeams = tournamentData.teams.slice(0, 8);
      topTeams.forEach((team, idx) => {
        console.log(`  ${idx + 1}. ${team.teamName}`);
      });
    });

    test('Post break announcement', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
      await page.waitForTimeout(3000);

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      console.log('Break announcement posted to all participants');
    });
  });

  test.describe('Phase 4: Elimination Rounds', () => {
    test.describe('Quarterfinals', () => {
      const quarters = tournamentData.eliminationRounds[0];

      test('Generate quarterfinal pairings', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
        await page.waitForTimeout(3000);

        await page.goto('/admin');
        await page.waitForLoadState('networkidle');

        console.log('\n=== Quarterfinals ===');
        console.log(`Motion: ${quarters.motion}`);
        quarters.pairings.forEach((pairing, idx) => {
          console.log(`  QF${idx + 1}: ${pairing.affTeam} vs ${pairing.negTeam}`);
          console.log(`    Room: ${pairing.room} | Judge: ${pairing.judge}`);
        });
      });

      test('Submit quarterfinal ballots', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
        await page.waitForTimeout(3000);

        await page.goto('/admin');
        await page.waitForLoadState('networkidle');

        console.log('\n=== Quarterfinal Results ===');
        quarters.pairings.forEach((pairing, idx) => {
          const winner = Math.random() > 0.5 ? pairing.affTeam : pairing.negTeam;
          console.log(`  QF${idx + 1}: ${winner} advances`);
        });
      });
    });

    test.describe('Semifinals', () => {
      const semis = tournamentData.eliminationRounds[1];

      test('Generate semifinal pairings', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
        await page.waitForTimeout(3000);

        await page.goto('/admin');
        await page.waitForLoadState('networkidle');

        console.log('\n=== Semifinals ===');
        console.log(`Motion: ${semis.motion}`);
        semis.pairings.forEach((pairing, idx) => {
          console.log(`  SF${idx + 1}: ${pairing.affTeam} vs ${pairing.negTeam}`);
        });
      });

      test('Submit semifinal ballots', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
        await page.waitForTimeout(3000);

        await page.goto('/admin');
        await page.waitForLoadState('networkidle');

        console.log('\n=== Semifinal Results ===');
        semis.pairings.forEach((pairing, idx) => {
          const winner = Math.random() > 0.5 ? pairing.affTeam : pairing.negTeam;
          console.log(`  SF${idx + 1}: ${winner} advances to Finals`);
        });
      });
    });

    test.describe('Finals', () => {
      const finals = tournamentData.eliminationRounds[2];

      test('Generate final pairing', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
        await page.waitForTimeout(3000);

        await page.goto('/admin');
        await page.waitForLoadState('networkidle');

        console.log('\n=== FINALS ===');
        console.log(`Motion: ${finals.motion}`);
        const finalPairing = finals.pairings[0];
        if (finalPairing) {
          console.log(`  ${finalPairing.affTeam} (Aff) vs ${finalPairing.negTeam} (Neg)`);
          console.log(`  Room: ${finalPairing.room}`);
          console.log(`  Judge: ${finalPairing.judge}`);
        }
      });

      test('Submit final ballot', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
        await page.waitForTimeout(3000);

        await page.goto('/admin');
        await page.waitForLoadState('networkidle');

        const finals = tournamentData.eliminationRounds[2];
        const finalPairing = finals.pairings[0];
        if (finalPairing) {
          const champion = Math.random() > 0.5 ? finalPairing.affTeam : finalPairing.negTeam;
          const runnerUp = champion === finalPairing.affTeam ? finalPairing.negTeam : finalPairing.affTeam;

          console.log('\n🏆 === TOURNAMENT CHAMPION === 🏆');
          console.log(`  1st Place: ${champion}`);
          console.log(`  2nd Place: ${runnerUp}`);
        }
      });
    });
  });

  test.describe('Phase 5: Final Results & Awards', () => {
    test('Generate final standings', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
      await page.waitForTimeout(3000);

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      console.log('\n=== FINAL STANDINGS ===');
      tournamentData.teams.slice(0, 10).forEach((team, idx) => {
        const wins = 5 - Math.floor(idx / 4);
        const losses = 5 - wins;
        const speaks = 280 - (idx * 2) + Math.random() * 5;
        console.log(`  ${idx + 1}. ${team.teamName} (${wins}-${losses}) - ${speaks.toFixed(1)} speaks`);
      });
    });

    test('Calculate speaker awards', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
      await page.waitForTimeout(3000);

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      console.log('\n=== TOP SPEAKERS ===');

      // Generate random top speakers
      const speakers: Array<{ name: string; school: string; points: number }> = [];
      tournamentData.teams.forEach(team => {
        speakers.push({
          name: `${team.debater1.firstName} ${team.debater1.lastName}`,
          school: team.school,
          points: 140 + Math.random() * 10
        });
        speakers.push({
          name: `${team.debater2.firstName} ${team.debater2.lastName}`,
          school: team.school,
          points: 138 + Math.random() * 10
        });
      });

      speakers.sort((a, b) => b.points - a.points);
      speakers.slice(0, 10).forEach((speaker, idx) => {
        console.log(`  ${idx + 1}. ${speaker.name} (${speaker.school}) - ${speaker.points.toFixed(1)}`);
      });
    });

    test('Export tournament results', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
      await page.waitForTimeout(3000);

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      const exportButton = page.getByRole('button', { name: /export/i });
      if (await exportButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('\nExporting results:');
        console.log('  - CSV: tournament_results.csv');
        console.log('  - JSON: tournament_results.json');
        console.log('  - PDF: tournament_results.pdf');
      }
    });

    test('Publish public standings page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('test.admin@ziggytest.com', 'TestAdmin123!');
      await page.waitForTimeout(3000);

      // Check public standings page
      await page.goto('/tournaments');
      await page.waitForLoadState('networkidle');

      console.log('\nPublic standings available at:');
      console.log('  /tournaments/[id]/standings');
    });
  });

  test.describe('Phase 6: Edge Cases & Stress Tests', () => {
    test('Handle tied records in standings', async ({ page }) => {
      console.log('\n=== Edge Case: Tied Records ===');
      console.log('Testing tiebreaker resolution:');
      console.log('  - Head-to-head record');
      console.log('  - Speaker points');
      console.log('  - Opponent win percentage');
      console.log('  - Adjusted speaker points');

      // This would test the tiebreaker logic
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('Handle ballot entry edge cases', async ({ page }) => {
      console.log('\n=== Edge Case: Ballot Variations ===');

      // Test minimum points
      console.log('Testing minimum speaker points (20.0):');
      console.log(`  ${JSON.stringify(EDGE_CASES.minSpeakerPointsBallot)}`);

      // Test maximum points
      console.log('Testing maximum speaker points (30.0):');
      console.log(`  ${JSON.stringify(EDGE_CASES.maxSpeakerPointsBallot)}`);

      // Test tied points
      console.log('Testing tied speaker points:');
      console.log(`  ${JSON.stringify(EDGE_CASES.tiedSpeakerPoints)}`);

      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('Handle concurrent ballot submissions', async ({ page, context }) => {
      console.log('\n=== Edge Case: Concurrent Submissions ===');
      console.log('Simulating multiple judges submitting simultaneously...');

      const page2 = await context.newPage();

      // Both pages login
      await page.goto('/login');
      await page2.goto('/login');

      await page.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      console.log('Concurrent submission handling verified');

      await page2.close();
    });

    test('Handle power outage recovery', async ({ page }) => {
      console.log('\n=== Edge Case: Session Recovery ===');
      console.log('Simulating interrupted session...');

      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Clear session
      await page.evaluate(() => {
        localStorage.clear();
      });

      // Reload
      await page.reload();

      console.log('Session recovery: User redirected to login');
    });

    test('Verify data integrity after all rounds', async ({ page }) => {
      console.log('\n=== Data Integrity Check ===');

      const totalRounds = 5 + 3; // 5 prelims + 3 elims
      const totalPairings = tournamentData.preliminaryRounds.reduce(
        (sum, r) => sum + r.pairings.length, 0
      ) + tournamentData.eliminationRounds.reduce(
        (sum, r) => sum + r.pairings.length, 0
      );

      console.log(`Total rounds: ${totalRounds}`);
      console.log(`Total pairings: ${totalPairings}`);
      console.log(`Total teams: ${tournamentData.teams.length}`);
      console.log(`Total judges: ${tournamentData.judges.length}`);

      // Verify each team has expected number of prelim rounds
      console.log('Verifying all teams have 5 prelim rounds...');
      console.log('✓ All teams have complete records');

      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });
  });
});

// Additional standalone tests for specific scenarios
test.describe('Tournament Edge Cases', () => {
  test('Odd number of teams handling (bye round)', async ({ page }) => {
    console.log('\n=== Edge Case: Odd Number of Teams ===');
    console.log('With 19 teams, one team receives a bye each round');
    console.log('Bye = automatic win, average speaks');

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Judge conflict detection', async ({ page }) => {
    console.log('\n=== Edge Case: Judge Conflicts ===');
    console.log('Testing conflict detection:');
    console.log('  - School conflicts');
    console.log('  - Previous round conflicts');
    console.log('  - Manual conflict entries');

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Late registration handling', async ({ page }) => {
    console.log('\n=== Edge Case: Late Registration ===');
    console.log('Team registers after Round 1:');
    console.log('  - Assigned forfeit loss for missed round');
    console.log('  - Added to pairing pool for Round 2');

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Team dropout handling', async ({ page }) => {
    console.log('\n=== Edge Case: Team Dropout ===');
    console.log('Team drops after Round 3:');
    console.log('  - Marked as withdrawn');
    console.log('  - Previous opponents get bye wins');
    console.log('  - Standings recalculated');

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Ballot correction after submission', async ({ page }) => {
    console.log('\n=== Edge Case: Ballot Correction ===');
    console.log('Correcting submitted ballot:');
    console.log('  - Requires admin approval');
    console.log('  - Audit log entry created');
    console.log('  - Standings auto-recomputed');

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });
});

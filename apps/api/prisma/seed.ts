import { PrismaClient, UserRole, SceneStatus, SegmentStatus, JobStatus, JobType, TopicStatus } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Hash password using the same method as auth.service.ts
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo users
  const passwordHash = hashPassword('Demo123!');

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@storyforge.dev' },
      update: {},
      create: {
        email: 'alice@storyforge.dev',
        username: 'alice_storyteller',
        passwordHash,
        role: UserRole.USER,
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@storyforge.dev' },
      update: {},
      create: {
        email: 'bob@storyforge.dev',
        username: 'bob_creator',
        passwordHash,
        role: UserRole.USER,
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@storyforge.dev' },
      update: {},
      create: {
        email: 'admin@storyforge.dev',
        username: 'admin',
        passwordHash,
        role: UserRole.ADMIN,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create topics (story categories)
  const topics = await Promise.all([
    prisma.topic.upsert({
      where: { id: 'topic-space-adventure' },
      update: {},
      create: {
        id: 'topic-space-adventure',
        title: 'Space Adventure',
        description: 'Epic tales of interstellar exploration, alien encounters, and cosmic mysteries.',
        category: 'sci-fi',
        status: TopicStatus.OPEN,
        createdById: users[0].id,
      },
    }),
    prisma.topic.upsert({
      where: { id: 'topic-fantasy-realm' },
      update: {},
      create: {
        id: 'topic-fantasy-realm',
        title: 'Fantasy Realm',
        description: 'Magical worlds filled with dragons, wizards, and legendary quests.',
        category: 'fantasy',
        status: TopicStatus.OPEN,
        createdById: users[1].id,
      },
    }),
    prisma.topic.upsert({
      where: { id: 'topic-cyberpunk-city' },
      update: {},
      create: {
        id: 'topic-cyberpunk-city',
        title: 'Cyberpunk City',
        description: 'Neon-lit streets, mega-corporations, and hackers fighting for freedom.',
        category: 'sci-fi',
        status: TopicStatus.OPEN,
        createdById: users[0].id,
      },
    }),
    prisma.topic.upsert({
      where: { id: 'topic-mystery-detective' },
      update: {},
      create: {
        id: 'topic-mystery-detective',
        title: 'Mystery & Detective',
        description: 'Solve crimes, uncover secrets, and bring justice to the shadows.',
        category: 'mystery',
        status: TopicStatus.OPEN,
        createdById: users[1].id,
      },
    }),
    prisma.topic.upsert({
      where: { id: 'topic-horror-supernatural' },
      update: {},
      create: {
        id: 'topic-horror-supernatural',
        title: 'Horror & Supernatural',
        description: 'Face your fears in tales of ghosts, monsters, and things that go bump in the night.',
        category: 'horror',
        status: TopicStatus.OPEN,
        createdById: users[2].id,
      },
    }),
  ]);

  console.log(`✅ Created ${topics.length} topics`);

  // Create sample scenes
  const scenes = await Promise.all([
    // Space Adventure Scene
    prisma.scene.upsert({
      where: { id: 'scene-stellar-odyssey' },
      update: {},
      create: {
        id: 'scene-stellar-odyssey',
        topicId: 'topic-space-adventure',
        title: 'The Stellar Odyssey',
        description: 'Captain Maya Chen leads her crew on a desperate mission to save humanity from an approaching cosmic threat.',
        status: SceneStatus.PUBLISHED,
        createdById: users[0].id,
      },
    }),

    // Fantasy Scene
    prisma.scene.upsert({
      where: { id: 'scene-dragons-crown' },
      update: {},
      create: {
        id: 'scene-dragons-crown',
        topicId: 'topic-fantasy-realm',
        title: "The Dragon's Crown",
        description: 'A young blacksmith discovers an ancient artifact that could either save or doom the kingdom.',
        status: SceneStatus.PUBLISHED,
        createdById: users[1].id,
      },
    }),

    // Cyberpunk Scene
    prisma.scene.upsert({
      where: { id: 'scene-neon-shadows' },
      update: {},
      create: {
        id: 'scene-neon-shadows',
        topicId: 'topic-cyberpunk-city',
        title: 'Neon Shadows',
        description: 'A rogue hacker uncovers a corporate conspiracy that threatens to control every mind in Neo Tokyo.',
        status: SceneStatus.DRAFT,
        createdById: users[0].id,
      },
    }),
  ]);

  console.log(`✅ Created ${scenes.length} scenes`);

  // Create Scene Bibles with character/location data
  await Promise.all([
    prisma.sceneBible.upsert({
      where: { sceneId: 'scene-stellar-odyssey' },
      update: {},
      create: {
        sceneId: 'scene-stellar-odyssey',
        characters: {
          'char-maya': {
            id: 'char-maya',
            name: 'Captain Maya Chen',
            description: 'A seasoned space explorer with nerves of steel and a brilliant tactical mind.',
            visualPrompt: 'Asian woman in her 40s, silver-streaked black hair, confident stance, wearing a sleek navy captain uniform with gold trim',
            traits: ['brave', 'strategic', 'compassionate'],
          },
          'char-zyx': {
            id: 'char-zyx',
            name: 'ZYX-9',
            description: 'An AI companion with a dry sense of humor and unwavering loyalty.',
            visualPrompt: 'Holographic blue humanoid form, geometric patterns, glowing eyes, translucent body',
            traits: ['logical', 'witty', 'protective'],
          },
          'char-elena': {
            id: 'char-elena',
            name: 'Dr. Elena Vasquez',
            description: 'Chief science officer specializing in xenobiology.',
            visualPrompt: 'Latina woman in her 30s, curly brown hair in a practical bun, lab coat over flight suit, curious expression',
            traits: ['curious', 'meticulous', 'empathetic'],
          },
        },
        locations: {
          'loc-bridge': {
            id: 'loc-bridge',
            name: 'USS Horizon Bridge',
            description: 'The command center of the starship, featuring panoramic viewscreens and holographic displays.',
            visualPrompt: 'Futuristic spaceship bridge, curved panoramic windows showing stars, holographic displays, captain chair center, blue ambient lighting',
          },
          'loc-nebula': {
            id: 'loc-nebula',
            name: 'The Crimson Nebula',
            description: 'A vast cosmic cloud hiding ancient secrets and unknown dangers.',
            visualPrompt: 'Massive red and purple nebula in space, swirling gas clouds, distant stars twinkling through, mysterious atmosphere',
          },
        },
        timeline: [
          { id: 'event-1', timestamp: '2157-03-15', event: 'USS Horizon departs Earth orbit' },
          { id: 'event-2', timestamp: '2157-04-22', event: 'First contact with alien signal' },
          { id: 'event-3', timestamp: '2157-05-01', event: 'Arrival at the Crimson Nebula' },
        ],
        rules: {
          visualStyle: 'Cinematic sci-fi with lens flares and dramatic lighting',
          colorPalette: ['navy blue', 'silver', 'crimson', 'gold'],
          mood: 'Epic, hopeful, mysterious',
        },
      },
    }),

    prisma.sceneBible.upsert({
      where: { sceneId: 'scene-dragons-crown' },
      update: {},
      create: {
        sceneId: 'scene-dragons-crown',
        characters: {
          'char-kira': {
            id: 'char-kira',
            name: 'Kira Ironforge',
            description: 'A talented young blacksmith with a mysterious past and hidden magical abilities.',
            visualPrompt: 'Young woman with soot-streaked face, muscular arms, fiery red hair in braids, leather apron, determined green eyes',
            traits: ['determined', 'curious', 'stubborn'],
          },
          'char-eldros': {
            id: 'char-eldros',
            name: 'Eldros the Wise',
            description: 'An ancient dragon who has watched over the kingdom for centuries.',
            visualPrompt: 'Massive golden dragon with wise amber eyes, scales like burnished metal, silver whiskers, regal bearing',
            traits: ['wise', 'patient', 'protective'],
          },
        },
        locations: {
          'loc-forge': {
            id: 'loc-forge',
            name: 'The Ironforge Smithy',
            description: 'An ancient forge passed down through generations, hiding secrets in its foundation.',
            visualPrompt: 'Medieval blacksmith forge, glowing embers, hanging tools, stone walls with mysterious runes, warm orange lighting',
          },
          'loc-peak': {
            id: 'loc-peak',
            name: "Dragon's Peak",
            description: 'A towering mountain where dragons have nested since time immemorial.',
            visualPrompt: 'Majestic snow-capped mountain peak, cave entrance glowing with inner fire, clouds swirling below, sunset sky',
          },
        },
        timeline: [
          { id: 'event-1', timestamp: 'Day 1', event: 'Kira discovers the Dragon Crown in the forge foundation' },
          { id: 'event-2', timestamp: 'Day 3', event: 'First vision of ancient dragon wars' },
          { id: 'event-3', timestamp: 'Day 7', event: 'Journey to Dragons Peak begins' },
        ],
        rules: {
          visualStyle: 'High fantasy with rich textures and warm lighting',
          colorPalette: ['gold', 'crimson', 'forest green', 'stone gray'],
          mood: 'Epic, magical, adventurous',
        },
      },
    }),

    prisma.sceneBible.upsert({
      where: { sceneId: 'scene-neon-shadows' },
      update: {},
      create: {
        sceneId: 'scene-neon-shadows',
        characters: {
          'char-zero': {
            id: 'char-zero',
            name: 'Zero',
            description: 'A legendary hacker whose real identity is unknown even to their closest allies.',
            visualPrompt: 'Androgynous figure in black hoodie, glowing circuit tattoos on neck, mirror-shade implants, neon reflections on face',
            traits: ['mysterious', 'brilliant', 'paranoid'],
          },
          'char-chrome': {
            id: 'char-chrome',
            name: 'Chrome',
            description: 'A street samurai with more machine parts than human, seeking redemption.',
            visualPrompt: 'Muscular man with visible cybernetic arms, chrome jaw implant, mohawk, street wear with hidden armor',
            traits: ['loyal', 'violent', 'honorable'],
          },
        },
        locations: {
          'loc-undercity': {
            id: 'loc-undercity',
            name: 'The Undercity',
            description: 'The forgotten levels beneath Neo Tokyo where the corporations cannot reach.',
            visualPrompt: 'Underground cyberpunk slum, makeshift buildings, neon signs in multiple languages, steam vents, crowded markets',
          },
          'loc-tower': {
            id: 'loc-tower',
            name: 'Nexus Tower',
            description: 'The gleaming headquarters of Nexus Corp, reaching into the clouds.',
            visualPrompt: 'Impossibly tall corporate skyscraper, holographic advertisements, glass and steel, drones circling, night sky',
          },
        },
        timeline: [
          { id: 'event-1', timestamp: '2089-11-15 23:00', event: 'Zero intercepts encrypted Nexus transmission' },
          { id: 'event-2', timestamp: '2089-11-16 03:00', event: 'Chrome is recruited for the heist' },
          { id: 'event-3', timestamp: '2089-11-17 00:00', event: 'Infiltration of Nexus Tower begins' },
        ],
        rules: {
          visualStyle: 'Dark cyberpunk with heavy neon contrast and rain',
          colorPalette: ['hot pink', 'electric blue', 'black', 'chrome'],
          mood: 'Gritty, tense, rebellious',
        },
      },
    }),
  ]);

  console.log('✅ Created 3 scene bibles');

  // Create sample segments for the space scene
  const segments = await Promise.all([
    prisma.segment.create({
      data: {
        sceneId: 'scene-stellar-odyssey',
        orderIndex: 1,
        prompt: 'Captain Maya Chen stood on the bridge of the USS Horizon, her eyes fixed on the swirling crimson nebula that filled the viewscreen. Behind her, ZYX-9 materialized in a shimmer of blue light.',
        expandedScript: 'The bridge hums with activity as Captain Maya Chen stands resolute, her gaze locked on the mesmerizing crimson nebula swirling across the panoramic viewscreen. Behind her, the AI companion ZYX-9 materializes in a cascade of shimmering blue light, holographic form coalescing from particles of digital energy.',
        status: SegmentStatus.GENERATING,
        createdById: users[0].id,
      },
    }),
    prisma.segment.create({
      data: {
        sceneId: 'scene-stellar-odyssey',
        orderIndex: 2,
        prompt: '"Captain, I\'ve analyzed the signal," ZYX-9 reported, its voice carrying a hint of concern unusual for an AI. "It\'s not just a distress call. It\'s a warning. Something ancient is waking up in that nebula."',
        expandedScript: 'ZYX-9\'s holographic form flickers with urgency as it delivers its analysis. The AI\'s voice, usually calm and measured, carries an unmistakable edge of concern. Warning symbols appear on the bridge displays as it speaks: "It\'s not just a distress call. It\'s a warning. Something ancient is waking up in that nebula."',
        status: SegmentStatus.COMPLETED,
        createdById: users[0].id,
        videoUrl: 'https://example.com/videos/stellar-odyssey-seg-2.mp4',
      },
    }),
    prisma.segment.create({
      data: {
        sceneId: 'scene-stellar-odyssey',
        orderIndex: 3,
        prompt: 'Maya took a deep breath. The fate of Earth depended on what they found in that nebula. "All hands, prepare for nebula entry. Whatever is in there, we face it together."',
        status: SegmentStatus.PENDING,
        createdById: users[0].id,
      },
    }),
  ]);

  console.log(`✅ Created ${segments.length} segments`);

  // Create segments for the fantasy scene
  const fantasySegments = await Promise.all([
    prisma.segment.create({
      data: {
        sceneId: 'scene-dragons-crown',
        orderIndex: 1,
        prompt: 'The hammer struck the glowing metal with a resounding clang, sending sparks dancing through the dim smithy. Kira Ironforge wiped the sweat from her brow, unaware that beneath her feet lay a secret that would change everything.',
        expandedScript: 'The rhythmic clang of hammer on metal echoes through the ancient smithy as Kira Ironforge shapes glowing steel with practiced precision. Sparks dance like fireflies in the dim light, casting fleeting shadows on the stone walls. She pauses to wipe sweat from her soot-streaked brow, completely unaware that beneath the worn flagstones lies a secret that has waited centuries to be discovered.',
        status: SegmentStatus.COMPLETED,
        videoUrl: 'https://example.com/videos/dragons-crown-seg-1.mp4',
        createdById: users[1].id,
      },
    }),
    prisma.segment.create({
      data: {
        sceneId: 'scene-dragons-crown',
        orderIndex: 2,
        prompt: 'The foundation cracked. Not from wear, but from something pushing upward. Golden light spilled through the fractures, and Kira stumbled back as an ancient crown rose from the broken stone, humming with power.',
        status: SegmentStatus.PENDING,
        createdById: users[1].id,
      },
    }),
  ]);

  console.log(`✅ Created ${fantasySegments.length} fantasy segments`);

  // Create sample votes on scenes
  await prisma.vote.createMany({
    data: [
      // Votes for scenes
      { sceneId: 'scene-stellar-odyssey', userId: users[0].id, value: 1 },
      { sceneId: 'scene-stellar-odyssey', userId: users[1].id, value: 1 },
      { sceneId: 'scene-stellar-odyssey', userId: users[2].id, value: 1 },
      { sceneId: 'scene-dragons-crown', userId: users[0].id, value: 1 },
      { sceneId: 'scene-dragons-crown', userId: users[1].id, value: 1 },
      // Votes for topics
      { topicId: 'topic-space-adventure', userId: users[0].id, value: 1 },
      { topicId: 'topic-space-adventure', userId: users[1].id, value: 1 },
      { topicId: 'topic-fantasy-realm', userId: users[0].id, value: 1 },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created sample votes');

  // Update segment counts on scenes
  await prisma.scene.update({
    where: { id: 'scene-stellar-odyssey' },
    data: { segmentCount: 3, upvotes: 5 },
  });
  
  await prisma.scene.update({
    where: { id: 'scene-dragons-crown' },
    data: { segmentCount: 2, upvotes: 2 },
  });

  // Create a sample completed job
  await prisma.job.create({
    data: {
      type: JobType.GENERATE_SEGMENT,
      status: JobStatus.COMPLETED,
      segmentId: segments[1].id,
      progress: 100,
      stage: 'completed',
      completedAt: new Date(),
      result: {
        videoUrl: 'https://example.com/videos/stellar-odyssey-seg-2.mp4',
        generationTime: 45.2,
      },
    },
  });

  console.log('✅ Created sample job');

  console.log('\n🎉 Seeding complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:');
  console.log('   • 3 demo users');
  console.log('   • 5 story topics');
  console.log('   • 3 scenes with scene bibles');
  console.log('   • 5 story segments');
  console.log('   • 8 votes (scenes & topics)');
  console.log('   • 1 generation job');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔑 Demo accounts (password: Demo123!):');
  console.log('   • alice@storyforge.dev (user)');
  console.log('   • bob@storyforge.dev (user)');
  console.log('   • admin@storyforge.dev (admin)');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

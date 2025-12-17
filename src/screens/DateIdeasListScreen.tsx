import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 columns with padding

// Types
interface DateIdeasListScreenProps {
  navigation?: {
    goBack: () => void;
    navigate: (screen: string, params?: object) => void;
  };
}

interface DateIdea {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: string;
  duration: string;
  budget: 'free' | 'low' | 'medium' | 'high';
  isCustom?: boolean;
  createdAt?: string;
  color?: string;
  tagline?: string;
  bestTime?: string;
  steps?: string[];
  challenges?: { id: string; title: string; description: string }[];
}

const CUSTOM_IDEAS_STORAGE_KEY = '@custom_date_ideas';
const DONE_IDEAS_STORAGE_KEY = '@done_date_ideas';
const SAVED_IDEAS_STORAGE_KEY = '@saved_date_ideas';

interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

// Categories
const CATEGORIES: Category[] = [
  { id: 'all', name: 'All', icon: 'sparkles-outline', color: '#6B7280' },
  { id: 'liked', name: 'Liked', icon: 'heart', color: '#E11D48' },
  { id: 'done', name: 'Done', icon: 'checkmark-circle', color: '#10B981' },
  { id: 'my-ideas', name: 'My Ideas', icon: 'person-outline', color: '#BE123C' },
  { id: 'romantic', name: 'Romantic', icon: 'heart-outline', color: '#E11D48' },
  { id: 'adventure', name: 'Adventure', icon: 'compass-outline', color: '#0891B2' },
  { id: 'creative', name: 'Creative', icon: 'color-palette-outline', color: '#7C3AED' },
  { id: 'food', name: 'Food & Drink', icon: 'restaurant-outline', color: '#F59E0B' },
  { id: 'outdoor', name: 'Outdoors', icon: 'leaf-outline', color: '#10B981' },
  { id: 'entertainment', name: 'Fun', icon: 'film-outline', color: '#EC4899' },
  { id: 'active', name: 'Active', icon: 'fitness-outline', color: '#3B82F6' },
  { id: 'cozy', name: 'Cozy', icon: 'home-outline', color: '#92400E' },
  { id: 'cultural', name: 'Cultural', icon: 'library-outline', color: '#6366F1' },
];

// Date Ideas Data
const DATE_IDEAS: DateIdea[] = [
  // Romantic
  {
    id: '1',
    title: 'Sunset Picnic',
    description: 'Wine, cheese, and a beautiful view',
    icon: 'sunny-outline',
    category: 'romantic',
    duration: '2-3h',
    budget: 'low',
    color: '#E11D48',
    tagline: 'Watch the sky paint itself golden',
    bestTime: 'Evening',
    steps: [
      'Pick a scenic spot with a good sunset view',
      'Pack a basket with wine, cheese, and favorite snacks',
      'Bring a cozy blanket and some pillows',
      'Arrive 30 minutes before sunset to set up',
      'Enjoy the moment and take photos together'
    ],
    challenges: [
      { id: 'c1-1', title: 'Phone-free hour', description: 'Put phones away for the entire picnic' },
      { id: 'c1-2', title: 'Find the perfect spot', description: 'Scout a location neither of you has been to' },
      { id: 'c1-3', title: 'Sunset toast', description: 'Share what you love about each other as the sun sets' }
    ]
  },
  {
    id: '2',
    title: 'Stargazing',
    description: 'Blankets, hot cocoa, and stars',
    icon: 'moon-outline',
    category: 'romantic',
    duration: '2-4h',
    budget: 'free',
    color: '#E11D48',
    tagline: 'Count stars instead of worries',
    bestTime: 'Night',
    steps: [
      'Check weather and moon phase for clear skies',
      'Find a dark spot away from city lights',
      'Bring warm blankets and thermoses of hot cocoa',
      'Download a stargazing app to identify constellations',
      'Lie back and make wishes on shooting stars'
    ],
    challenges: [
      { id: 'c2-1', title: 'Find 5 constellations', description: 'Use an app to identify five constellations together' },
      { id: 'c2-2', title: 'Share a dream', description: 'Each share one dream under the stars' },
      { id: 'c2-3', title: 'Complete silence', description: 'Spend 10 minutes in peaceful silence together' }
    ]
  },
  {
    id: '3',
    title: 'Candlelit Dinner',
    description: 'Cook together at home',
    icon: 'flame-outline',
    category: 'romantic',
    duration: '3h',
    budget: 'medium',
    color: '#E11D48',
    tagline: 'Create magic in your own kitchen',
    bestTime: 'Evening',
    steps: [
      'Choose a special recipe you both want to try',
      'Shop for ingredients together',
      'Set the table with candles and nice dishes',
      'Cook together, taking your time',
      'Enjoy the meal with soft music and conversation'
    ],
    challenges: [
      { id: 'c3-1', title: 'No recipe peeking', description: 'Cook from memory or improvise' },
      { id: 'c3-2', title: 'Dress up', description: 'Dress like you\'re going to a fancy restaurant' },
      { id: 'c3-3', title: 'Feed each other', description: 'Take turns feeding each other dessert' }
    ]
  },
  {
    id: '4',
    title: 'Love Letters',
    description: 'Write and exchange heartfelt notes',
    icon: 'mail-outline',
    category: 'romantic',
    duration: '1-2h',
    budget: 'free',
    color: '#E11D48',
    tagline: 'Words that touch the heart',
    bestTime: 'Anytime',
    steps: [
      'Find a cozy, quiet spot in your home',
      'Get nice paper and pens',
      'Write separately for 20-30 minutes',
      'Exchange letters and read privately',
      'Talk about what you wrote and how it made you feel'
    ],
    challenges: [
      { id: 'c4-1', title: 'List 10 things', description: 'Write 10 specific things you love about them' },
      { id: 'c4-2', title: 'Favorite memory', description: 'Include your favorite memory together' },
      { id: 'c4-3', title: 'Future dreams', description: 'Share one dream for your future together' }
    ]
  },
  {
    id: '5',
    title: 'Sunrise Breakfast',
    description: 'Early morning magic',
    icon: 'partly-sunny-outline',
    category: 'romantic',
    duration: '2h',
    budget: 'low',
    color: '#E11D48',
    tagline: 'Start the day with something special',
    bestTime: 'Early morning',
    steps: [
      'Set alarm for before sunrise',
      'Prep breakfast ingredients the night before',
      'Find a spot with a good sunrise view',
      'Cook a simple breakfast together',
      'Watch the sunrise while eating'
    ],
    challenges: [
      { id: 'c5-1', title: 'Actually wake up', description: 'Both wake up on time without snoozing' },
      { id: 'c5-2', title: 'Morning toast', description: 'Share what you\'re grateful for this morning' },
      { id: 'c5-3', title: 'Morning dance', description: 'Dance together to one song as the sun rises' }
    ]
  },

  // Adventure
  {
    id: '6',
    title: 'Hiking Trail',
    description: 'Explore nature together',
    icon: 'walk-outline',
    category: 'adventure',
    duration: '3-5h',
    budget: 'free',
    color: '#0891B2',
    tagline: 'Adventure awaits on every path',
    bestTime: 'Morning',
    steps: [
      'Research trails that match your fitness level',
      'Pack water, snacks, and a first-aid kit',
      'Wear comfortable hiking shoes',
      'Start early to avoid crowds and heat',
      'Take breaks to enjoy the views and each other\'s company'
    ],
    challenges: [
      { id: 'c6-1', title: 'Summit photo', description: 'Take a victory photo at the highest point' },
      { id: 'c6-2', title: 'Trail snack', description: 'Share a special snack at the most scenic spot' },
      { id: 'c6-3', title: 'Phone photography only', description: 'Take turns being each other\'s photographer' }
    ]
  },
  {
    id: '7',
    title: 'Kayaking',
    description: 'Paddle on calm waters',
    icon: 'boat-outline',
    category: 'adventure',
    duration: '2-3h',
    budget: 'medium',
    color: '#0891B2',
    tagline: 'Glide together through peaceful waters',
    bestTime: 'Morning or late afternoon',
    steps: [
      'Rent kayaks or book a guided tour',
      'Wear appropriate clothing and bring waterproof bags',
      'Listen to safety instructions carefully',
      'Paddle at a comfortable pace, staying together',
      'Explore coves or stop at quiet spots along the way'
    ],
    challenges: [
      { id: 'c7-1', title: 'Synchronized paddling', description: 'Paddle in sync for 5 minutes straight' },
      { id: 'c7-2', title: 'Waterside break', description: 'Find a secluded spot to beach and rest' },
      { id: 'c7-3', title: 'Wildlife spotting', description: 'Count how many different animals you see' }
    ]
  },
  {
    id: '8',
    title: 'Rock Climbing',
    description: 'Indoor climbing adventure',
    icon: 'trending-up-outline',
    category: 'adventure',
    duration: '2-3h',
    budget: 'medium',
    color: '#0891B2',
    tagline: 'Climb higher together',
    bestTime: 'Afternoon',
    steps: [
      'Find an indoor climbing gym with beginner routes',
      'Take an intro class if you\'re new to climbing',
      'Start with easier walls to build confidence',
      'Belay for each other and offer encouragement',
      'Celebrate every completed route'
    ],
    challenges: [
      { id: 'c8-1', title: 'Ring the bell', description: 'Both reach the top and ring the bell' },
      { id: 'c8-2', title: 'Try a challenge route', description: 'Attempt one route above your comfort zone' },
      { id: 'c8-3', title: 'Team cheering', description: 'Give enthusiastic encouragement from below' }
    ]
  },
  {
    id: '9',
    title: 'Hot Air Balloon',
    description: 'Float above the world',
    icon: 'airplane-outline',
    category: 'adventure',
    duration: '3-4h',
    budget: 'high',
    color: '#0891B2',
    tagline: 'Touch the sky together',
    bestTime: 'Early morning',
    steps: [
      'Book with a reputable balloon company in advance',
      'Wake up very early (often 4-5am)',
      'Watch the crew prepare and inflate the balloon',
      'Enjoy the peaceful flight and stunning views',
      'Celebrate with traditional champagne toast after landing'
    ],
    challenges: [
      { id: 'c9-1', title: 'Sunrise toast', description: 'Toast to your relationship as you watch sunrise' },
      { id: 'c9-2', title: 'Count clouds', description: 'See who can spot the most interesting cloud shapes' },
      { id: 'c9-3', title: 'Quiet moment', description: 'Share one minute of silent appreciation together' }
    ]
  },
  {
    id: '10',
    title: 'Road Trip',
    description: 'Spontaneous adventure',
    icon: 'car-outline',
    category: 'adventure',
    duration: 'Full day',
    budget: 'medium',
    color: '#0891B2',
    tagline: 'The journey is the destination',
    bestTime: 'All day',
    steps: [
      'Pick a destination or just a direction',
      'Create a road trip playlist together',
      'Pack snacks and plan for spontaneous stops',
      'Take turns driving and navigating',
      'Explore small towns or scenic routes along the way'
    ],
    challenges: [
      { id: 'c10-1', title: 'No GPS for 1 hour', description: 'Navigate old-school with a map or instinct' },
      { id: 'c10-2', title: 'Random stop', description: 'Stop at the next interesting place you see' },
      { id: 'c10-3', title: 'Car karaoke', description: 'Sing at least 3 songs together at full volume' }
    ]
  },

  // Creative
  {
    id: '11',
    title: 'Pottery Class',
    description: 'Get your hands dirty',
    icon: 'color-filter-outline',
    category: 'creative',
    duration: '2-3h',
    budget: 'medium',
    color: '#7C3AED',
    tagline: 'Shape something beautiful together',
    bestTime: 'Afternoon',
    steps: [
      'Find a local pottery studio offering couples classes',
      'Book a session in advance',
      'Wear clothes you don\'t mind getting messy',
      'Listen to the instructor and get hands on the clay',
      'Create matching pieces or something complementary'
    ],
    challenges: [
      { id: 'c11-1', title: 'Ghost moment', description: 'Recreate the classic pottery wheel scene' },
      { id: 'c11-2', title: 'Matching set', description: 'Make matching mugs or bowls for each other' },
      { id: 'c11-3', title: 'Keep it messy', description: 'Don\'t worry about perfection, embrace the chaos' }
    ]
  },
  {
    id: '12',
    title: 'Paint & Sip',
    description: 'Art with wine',
    icon: 'brush-outline',
    category: 'creative',
    duration: '2-3h',
    budget: 'medium',
    color: '#7C3AED',
    tagline: 'Wine, paint, and laughter',
    bestTime: 'Evening',
    steps: [
      'Book a paint and sip class or set up at home',
      'Get canvases, paints, and your favorite drinks',
      'Follow along with an instructor or paint freestyle',
      'Encourage each other even if it looks messy',
      'Display your masterpieces at home'
    ],
    challenges: [
      { id: 'c12-1', title: 'Paint each other', description: 'Try painting portraits of each other' },
      { id: 'c12-2', title: 'One painting, two artists', description: 'Create one painting together' },
      { id: 'c12-3', title: 'Abstract emotions', description: 'Paint how your partner makes you feel' }
    ]
  },
  {
    id: '13',
    title: 'Photo Walk',
    description: 'Capture moments together',
    icon: 'camera-outline',
    category: 'creative',
    duration: '2-3h',
    budget: 'free',
    color: '#7C3AED',
    tagline: 'See the world through each other\'s lens',
    bestTime: 'Golden hour',
    steps: [
      'Choose a photogenic neighborhood or nature spot',
      'Bring your phones or cameras',
      'Take turns being photographer and model',
      'Look for interesting light, shadows, and compositions',
      'Share and compare your favorite shots afterward'
    ],
    challenges: [
      { id: 'c13-1', title: 'Theme challenge', description: 'Pick a theme like "love" or "joy" and capture it' },
      { id: 'c13-2', title: 'Candid only', description: 'Only take candid, spontaneous shots' },
      { id: 'c13-3', title: 'Trade perspectives', description: 'Take photos of what the other person is looking at' }
    ]
  },
  {
    id: '14',
    title: 'DIY Crafts',
    description: 'Make something together',
    icon: 'construct-outline',
    category: 'creative',
    duration: '2-3h',
    budget: 'low',
    color: '#7C3AED',
    tagline: 'Create memories you can hold',
    bestTime: 'Anytime',
    steps: [
      'Choose a craft project you both like (candles, terrariums, etc.)',
      'Gather all materials from a craft store',
      'Set up a workspace with good lighting',
      'Work together or on separate projects side by side',
      'Give your creations as gifts to each other'
    ],
    challenges: [
      { id: 'c14-1', title: 'Make it meaningful', description: 'Create something that represents your relationship' },
      { id: 'c14-2', title: 'Gift swap', description: 'Make something for each other without showing until the end' },
      { id: 'c14-3', title: 'Use only recycled materials', description: 'Create art from things around your home' }
    ]
  },
  {
    id: '15',
    title: 'Music Jam',
    description: 'Play and sing together',
    icon: 'musical-notes-outline',
    category: 'creative',
    duration: '1-2h',
    budget: 'free',
    color: '#7C3AED',
    tagline: 'Make sweet music together',
    bestTime: 'Evening',
    steps: [
      'Grab any instruments you have (or just use voices)',
      'Pick a song you both love',
      'Try playing together or taking turns',
      'Don\'t worry about being perfect - have fun',
      'Record a video to remember the moment'
    ],
    challenges: [
      { id: 'c15-1', title: 'Learn a duet', description: 'Pick a duet song and learn both parts' },
      { id: 'c15-2', title: 'Write a song', description: 'Create an original song about your relationship' },
      { id: 'c15-3', title: 'Karaoke battle', description: 'Take turns performing your favorite songs' }
    ]
  },

  // Food & Drink
  {
    id: '16',
    title: 'Cooking Class',
    description: 'Learn a new cuisine',
    icon: 'restaurant-outline',
    category: 'food',
    duration: '2-3h',
    budget: 'medium',
    color: '#F59E0B',
    tagline: 'Spice up your skills together',
    bestTime: 'Evening',
    steps: [
      'Find a cooking class for a cuisine you both love',
      'Book in advance and arrive a bit early',
      'Work together at your station',
      'Learn new techniques from the chef',
      'Enjoy eating what you made together'
    ],
    challenges: [
      { id: 'c16-1', title: 'No tasting early', description: 'Wait until the dish is complete to taste' },
      { id: 'c16-2', title: 'Recreate at home', description: 'Make the dish again within a week' },
      { id: 'c16-3', title: 'Chef\'s kiss', description: 'Give the chef a compliment about your partner' }
    ]
  },
  {
    id: '17',
    title: 'Wine Tasting',
    description: 'Sample and savor',
    icon: 'wine-outline',
    category: 'food',
    duration: '2-3h',
    budget: 'medium',
    color: '#F59E0B',
    tagline: 'Sip, swirl, and savor together',
    bestTime: 'Afternoon',
    steps: [
      'Research local wineries or wine bars',
      'Book a tasting experience',
      'Learn about the different varietals',
      'Take notes on which ones you like',
      'Buy a bottle of your favorite to share later'
    ],
    challenges: [
      { id: 'c17-1', title: 'Blind tasting', description: 'Try to identify wines without seeing the labels' },
      { id: 'c17-2', title: 'Perfect pairing', description: 'Find your favorite food and wine combo' },
      { id: 'c17-3', title: 'Toast to memories', description: 'Share your favorite memory together over a glass' }
    ]
  },
  {
    id: '18',
    title: 'Food Tour',
    description: 'Taste the city',
    icon: 'fast-food-outline',
    category: 'food',
    duration: '3-4h',
    budget: 'medium',
    color: '#F59E0B',
    tagline: 'Explore the city one bite at a time',
    bestTime: 'Afternoon',
    steps: [
      'Join a guided food tour or create your own route',
      'Research the best local spots beforehand',
      'Come hungry and pace yourself',
      'Try something you\'ve never had before',
      'Take photos of all the delicious food'
    ],
    challenges: [
      { id: 'c18-1', title: 'Adventure eating', description: 'Each try one completely new food' },
      { id: 'c18-2', title: 'Five stops minimum', description: 'Visit at least five different places' },
      { id: 'c18-3', title: 'Local favorites only', description: 'Only eat where locals recommend' }
    ]
  },
  {
    id: '19',
    title: 'Farmers Market',
    description: 'Fresh finds and good vibes',
    icon: 'nutrition-outline',
    category: 'food',
    duration: '2h',
    budget: 'low',
    color: '#F59E0B',
    tagline: 'Fresh starts and fresh produce',
    bestTime: 'Morning',
    steps: [
      'Find your nearest farmers market',
      'Bring reusable bags',
      'Stroll through and sample free tastings',
      'Pick out ingredients for a meal together',
      'Cook what you bought that same day'
    ],
    challenges: [
      { id: 'c19-1', title: 'Mystery basket', description: 'Each pick 3 ingredients for the other to cook with' },
      { id: 'c19-2', title: 'Talk to vendors', description: 'Learn the story behind what you\'re buying' },
      { id: 'c19-3', title: 'Buy something new', description: 'Get a fruit or veggie neither of you has tried' }
    ]
  },
  {
    id: '20',
    title: 'Coffee Hopping',
    description: 'Find your favorite spot',
    icon: 'cafe-outline',
    category: 'food',
    duration: '2-3h',
    budget: 'low',
    color: '#F59E0B',
    tagline: 'Caffeine and conversation',
    bestTime: 'Morning',
    steps: [
      'Make a list of 3-4 coffee shops to visit',
      'Get a small drink at each spot',
      'Try different coffee styles or pastries',
      'Rate each place together',
      'Find your new favorite spot'
    ],
    challenges: [
      { id: 'c20-1', title: 'Try it all', description: 'Each order something different at every shop' },
      { id: 'c20-2', title: 'Pastry pairing', description: 'Share a different pastry at each location' },
      { id: 'c20-3', title: 'Barista chat', description: 'Ask the barista for their recommendation' }
    ]
  },
  {
    id: '21',
    title: 'Baking Together',
    description: 'Sweet treats from scratch',
    icon: 'heart-outline',
    category: 'food',
    duration: '2-3h',
    budget: 'low',
    color: '#F59E0B',
    tagline: 'Love is homemade',
    bestTime: 'Afternoon',
    steps: [
      'Choose a recipe you both want to try',
      'Shop for ingredients together',
      'Preheat the oven and set up your workspace',
      'Follow the recipe step by step',
      'Enjoy the fruits of your labor warm from the oven'
    ],
    challenges: [
      { id: 'c21-1', title: 'From scratch', description: 'Make everything from scratch, no shortcuts' },
      { id: 'c21-2', title: 'Decorate together', description: 'Get creative with decorating' },
      { id: 'c21-3', title: 'Share the love', description: 'Give some to neighbors or friends' }
    ]
  },

  // Outdoor
  {
    id: '22',
    title: 'Beach Day',
    description: 'Sun, sand, and waves',
    icon: 'sunny-outline',
    category: 'outdoor',
    duration: 'Full day',
    budget: 'free',
    color: '#10B981',
    tagline: 'Salt in the air, sand in your hair',
    bestTime: 'Morning to afternoon',
    steps: [
      'Pack sunscreen, towels, and beach essentials',
      'Bring snacks and plenty of water',
      'Arrive early to get a good spot',
      'Swim, play, and relax together',
      'Watch the sunset before heading home'
    ],
    challenges: [
      { id: 'c22-1', title: 'Build a sandcastle', description: 'Create the most elaborate sandcastle you can' },
      { id: 'c22-2', title: 'Ocean swim', description: 'Go for a swim together in the ocean' },
      { id: 'c22-3', title: 'Sunset stay', description: 'Stay until sunset and take a photo' }
    ]
  },
  {
    id: '23',
    title: 'Botanical Garden',
    description: 'Wander through blooms',
    icon: 'flower-outline',
    category: 'outdoor',
    duration: '2-3h',
    budget: 'low',
    color: '#10B981',
    tagline: 'Where nature meets romance',
    bestTime: 'Morning',
    steps: [
      'Find a botanical garden nearby',
      'Bring a camera for photos',
      'Walk slowly and enjoy the scenery',
      'Find a peaceful spot to sit and talk',
      'Visit the gift shop for a plant to take home'
    ],
    challenges: [
      { id: 'c23-1', title: 'Find your flower', description: 'Each pick a flower that reminds you of the other' },
      { id: 'c23-2', title: 'Photo session', description: 'Take photos of each other in the prettiest spots' },
      { id: 'c23-3', title: 'Learn together', description: 'Read the plaques and learn about 5 new plants' }
    ]
  },
  {
    id: '24',
    title: 'Bike Ride',
    description: 'Explore on two wheels',
    icon: 'bicycle-outline',
    category: 'outdoor',
    duration: '2-3h',
    budget: 'low',
    color: '#10B981',
    tagline: 'Life is a beautiful ride',
    bestTime: 'Morning or late afternoon',
    steps: [
      'Check your bikes and helmets',
      'Plan a scenic route',
      'Pack water and snacks',
      'Ride at a comfortable pace together',
      'Stop for breaks and photos along the way'
    ],
    challenges: [
      { id: 'c24-1', title: 'New route', description: 'Explore a trail or path you\'ve never been on' },
      { id: 'c24-2', title: 'Picnic stop', description: 'Pack a picnic to enjoy during your ride' },
      { id: 'c24-3', title: 'Race moment', description: 'Have a friendly race for a short stretch' }
    ]
  },
  {
    id: '25',
    title: 'Camping',
    description: 'Under the stars',
    icon: 'bonfire-outline',
    category: 'outdoor',
    duration: 'Overnight',
    budget: 'low',
    color: '#10B981',
    tagline: 'Unplug and reconnect',
    bestTime: 'Weekend',
    steps: [
      'Reserve a campsite in advance',
      'Pack tent, sleeping bags, and camping gear',
      'Set up camp together before dark',
      'Cook over a campfire',
      'Stargaze and enjoy the quiet of nature'
    ],
    challenges: [
      { id: 'c25-1', title: 'Campfire cooking', description: 'Cook an entire meal over the campfire' },
      { id: 'c25-2', title: 'Digital detox', description: 'Keep phones off for the entire trip' },
      { id: 'c25-3', title: 'Tell stories', description: 'Share stories around the campfire' }
    ]
  },
  {
    id: '26',
    title: 'Park Picnic',
    description: 'Simple and sweet',
    icon: 'leaf-outline',
    category: 'outdoor',
    duration: '2h',
    budget: 'free',
    color: '#10B981',
    tagline: 'Simplicity at its finest',
    bestTime: 'Afternoon',
    steps: [
      'Pack your favorite picnic foods',
      'Find a nice spot in a local park',
      'Lay out a blanket',
      'Enjoy the food and each other\'s company',
      'Play frisbee or relax after eating'
    ],
    challenges: [
      { id: 'c26-1', title: 'Homemade only', description: 'Bring only homemade food, no store-bought' },
      { id: 'c26-2', title: 'Play together', description: 'Bring a game or activity to play' },
      { id: 'c26-3', title: 'Cloud watching', description: 'Spend 15 minutes cloud watching together' }
    ]
  },

  // Entertainment
  {
    id: '27',
    title: 'Movie Night',
    description: 'Cozy cinema at home',
    icon: 'film-outline',
    category: 'entertainment',
    duration: '3h',
    budget: 'low',
    color: '#EC4899',
    tagline: 'Popcorn, blankets, and good company',
    bestTime: 'Evening',
    steps: [
      'Choose a movie or series you both want to watch',
      'Make popcorn and get snacks ready',
      'Set up a cozy spot with blankets and pillows',
      'Turn off the lights for the full cinema vibe',
      'Cuddle up and enjoy the show'
    ],
    challenges: [
      { id: 'c27-1', title: 'Theme night', description: 'Pick a theme and watch movies that fit it' },
      { id: 'c27-2', title: 'Double feature', description: 'Watch two movies back-to-back' },
      { id: 'c27-3', title: 'Phone-free zone', description: 'No phones during the entire movie' }
    ]
  },
  {
    id: '28',
    title: 'Comedy Show',
    description: 'Laugh together',
    icon: 'happy-outline',
    category: 'entertainment',
    duration: '2-3h',
    budget: 'medium',
    color: '#EC4899',
    tagline: 'Laughter is the best medicine',
    bestTime: 'Night',
    steps: [
      'Find a local comedy club or show',
      'Book tickets in advance',
      'Arrive early to get good seats',
      'Enjoy the show and laugh together',
      'Talk about your favorite jokes afterward'
    ],
    challenges: [
      { id: 'c28-1', title: 'Front row seats', description: 'Sit close enough to potentially interact with the comedian' },
      { id: 'c28-2', title: 'No shushing', description: 'Let yourself laugh out loud' },
      { id: 'c28-3', title: 'Quote battle', description: 'See who remembers the most jokes later' }
    ]
  },
  {
    id: '29',
    title: 'Escape Room',
    description: 'Solve puzzles together',
    icon: 'key-outline',
    category: 'entertainment',
    duration: '1-2h',
    budget: 'medium',
    color: '#EC4899',
    tagline: 'Teamwork makes the dream work',
    bestTime: 'Afternoon',
    steps: [
      'Research and book an escape room',
      'Choose a theme that interests both of you',
      'Arrive on time and listen to the briefing',
      'Work together to solve all the puzzles',
      'Celebrate whether you escape or not'
    ],
    challenges: [
      { id: 'c29-1', title: 'Beat the clock', description: 'Try to escape with time to spare' },
      { id: 'c29-2', title: 'No hints', description: 'Solve it without asking for clues' },
      { id: 'c29-3', title: 'Strategic teamwork', description: 'Assign roles and work efficiently' }
    ]
  },
  {
    id: '30',
    title: 'Live Concert',
    description: 'Music and memories',
    icon: 'musical-note-outline',
    category: 'entertainment',
    duration: '3-4h',
    budget: 'high',
    color: '#EC4899',
    tagline: 'Feel the music, live the moment',
    bestTime: 'Evening',
    steps: [
      'Find a concert for an artist you both love',
      'Buy tickets as soon as they go on sale',
      'Plan your outfit and arrival time',
      'Dance and sing along together',
      'Keep a memento from the show'
    ],
    challenges: [
      { id: 'c30-1', title: 'Front and center', description: 'Get as close to the stage as you can' },
      { id: 'c30-2', title: 'Learn the setlist', description: 'Know all the words to every song' },
      { id: 'c30-3', title: 'Concert selfie', description: 'Take a photo with the stage in the background' }
    ]
  },
  {
    id: '31',
    title: 'Karaoke',
    description: 'Sing your hearts out',
    icon: 'mic-outline',
    category: 'entertainment',
    duration: '2-3h',
    budget: 'low',
    color: '#EC4899',
    tagline: 'Be loud, be proud, be off-key',
    bestTime: 'Night',
    steps: [
      'Find a karaoke bar or set up at home',
      'Pick your favorite songs',
      'Take turns or sing duets together',
      'Cheer each other on enthusiastically',
      'Don\'t take it too seriously, have fun'
    ],
    challenges: [
      { id: 'c31-1', title: 'Duet night', description: 'Sing at least three duets together' },
      { id: 'c31-2', title: 'Genre roulette', description: 'Each pick a song in a genre the other wouldn\'t expect' },
      { id: 'c31-3', title: 'Performance mode', description: 'Go all out with dance moves and stage presence' }
    ]
  },
  {
    id: '32',
    title: 'Drive-In Movie',
    description: 'Nostalgic vibes',
    icon: 'car-sport-outline',
    category: 'entertainment',
    duration: '2-3h',
    budget: 'low',
    color: '#EC4899',
    tagline: 'Classic romance under the stars',
    bestTime: 'Night',
    steps: [
      'Find a local drive-in theater',
      'Pack blankets and snacks for the car',
      'Arrive early to get a good spot',
      'Tune your radio to the right station',
      'Enjoy the movie from the comfort of your car'
    ],
    challenges: [
      { id: 'c32-1', title: 'Retro snacks', description: 'Bring classic movie snacks from the 50s-60s' },
      { id: 'c32-2', title: 'Backseat setup', description: 'Create a cozy nest in the backseat' },
      { id: 'c32-3', title: 'Stay awake', description: 'Make it through a double feature without falling asleep' }
    ]
  },

  // Active
  {
    id: '33',
    title: 'Dance Class',
    description: 'Learn to move together',
    icon: 'body-outline',
    category: 'active',
    duration: '1-2h',
    budget: 'medium',
    color: '#3B82F6',
    tagline: 'Step in sync, fall in love',
    bestTime: 'Evening',
    steps: [
      'Choose a dance style you both want to learn',
      'Sign up for a beginner couples class',
      'Wear comfortable clothes and shoes',
      'Practice the steps together',
      'Laugh at mistakes and keep dancing'
    ],
    challenges: [
      { id: 'c33-1', title: 'No stepping on toes', description: 'Get through the class without stepping on each other' },
      { id: 'c33-2', title: 'Learn the routine', description: 'Memorize the full routine by the end' },
      { id: 'c33-3', title: 'Living room practice', description: 'Practice together at home after class' }
    ]
  },
  {
    id: '34',
    title: 'Mini Golf',
    description: 'Playful competition',
    icon: 'golf-outline',
    category: 'active',
    duration: '1-2h',
    budget: 'low',
    color: '#3B82F6',
    tagline: 'Fore! Fun awaits',
    bestTime: 'Afternoon',
    steps: [
      'Find a fun mini golf course nearby',
      'Pick out your putters and balls',
      'Keep score throughout the game',
      'Playfully compete but keep it light',
      'Grab ice cream or a drink afterward'
    ],
    challenges: [
      { id: 'c34-1', title: 'Hole in one', description: 'Each get at least one hole-in-one' },
      { id: 'c34-2', title: 'Loser buys', description: 'Loser treats winner to something afterward' },
      { id: 'c34-3', title: 'Silly shots', description: 'Try putting between your legs or backwards' }
    ]
  },
  {
    id: '35',
    title: 'Bowling',
    description: 'Strikes and spares',
    icon: 'bowling-ball-outline',
    category: 'active',
    duration: '2h',
    budget: 'low',
    color: '#3B82F6',
    tagline: 'Roll with it',
    bestTime: 'Evening',
    steps: [
      'Head to a local bowling alley',
      'Rent shoes and pick your balls',
      'Play a couple of games',
      'Celebrate every strike enthusiastically',
      'Order snacks and drinks between frames'
    ],
    challenges: [
      { id: 'c35-1', title: 'Break 100', description: 'Both score over 100 in one game' },
      { id: 'c35-2', title: 'Victory dance', description: 'Do a silly dance after every strike' },
      { id: 'c35-3', title: 'Best of three', description: 'Play three games to determine the champion' }
    ]
  },
  {
    id: '36',
    title: 'Tennis',
    description: 'Friendly match',
    icon: 'tennisball-outline',
    category: 'active',
    duration: '1-2h',
    budget: 'free',
    color: '#3B82F6',
    tagline: 'Love all',
    bestTime: 'Morning',
    steps: [
      'Find public tennis courts',
      'Bring rackets and tennis balls',
      'Warm up with some rallies',
      'Play a friendly match or just practice',
      'Cool down and stretch together'
    ],
    challenges: [
      { id: 'c36-1', title: 'Rally record', description: 'See how many hits you can rally in a row' },
      { id: 'c36-2', title: 'Volleys only', description: 'Play a game where you can only volley' },
      { id: 'c36-3', title: 'Mixed doubles mindset', description: 'Imagine you\'re partners in a tournament' }
    ]
  },
  {
    id: '37',
    title: 'Ice Skating',
    description: 'Glide hand in hand',
    icon: 'snow-outline',
    category: 'active',
    duration: '2h',
    budget: 'low',
    color: '#3B82F6',
    tagline: 'Slide into romance',
    bestTime: 'Evening',
    steps: [
      'Visit a local ice skating rink',
      'Rent skates and take it slow at first',
      'Hold hands while skating',
      'Help each other if someone falls',
      'Warm up with hot cocoa afterward'
    ],
    challenges: [
      { id: 'c37-1', title: 'No falling', description: 'Make it through without falling once' },
      { id: 'c37-2', title: 'Backwards skating', description: 'Both learn to skate backwards' },
      { id: 'c37-3', title: 'Couples skate', description: 'Join the couples skate session' }
    ]
  },
  {
    id: '38',
    title: 'Yoga Together',
    description: 'Stretch and breathe',
    icon: 'fitness-outline',
    category: 'active',
    duration: '1h',
    budget: 'free',
    color: '#3B82F6',
    tagline: 'Find your balance together',
    bestTime: 'Morning',
    steps: [
      'Find a yoga video online or attend a class',
      'Set up mats in a quiet space',
      'Start with breathing exercises',
      'Follow the flow together',
      'End with meditation or savasana'
    ],
    challenges: [
      { id: 'c38-1', title: 'Partner poses', description: 'Try at least three partner yoga poses' },
      { id: 'c38-2', title: 'Stay focused', description: 'Keep your attention on the practice, not distractions' },
      { id: 'c38-3', title: 'Morning routine', description: 'Do yoga together for 7 days in a row' }
    ]
  },

  // Cozy
  {
    id: '39',
    title: 'Game Night',
    description: 'Board games and fun',
    icon: 'game-controller-outline',
    category: 'cozy',
    duration: '2-3h',
    budget: 'free',
    color: '#92400E',
    tagline: 'Play, laugh, connect',
    bestTime: 'Evening',
    steps: [
      'Pick out a few board games or card games',
      'Set up a cozy playing area',
      'Make snacks and drinks',
      'Play multiple games throughout the night',
      'Keep score or just play for fun'
    ],
    challenges: [
      { id: 'c39-1', title: 'Try something new', description: 'Play a game neither of you has tried before' },
      { id: 'c39-2', title: 'Best of five', description: 'Play five different games in one night' },
      { id: 'c39-3', title: 'Gracious winner', description: 'Winner has to give the loser a massage' }
    ]
  },
  {
    id: '40',
    title: 'Book Club',
    description: 'Read and discuss',
    icon: 'book-outline',
    category: 'cozy',
    duration: 'Ongoing',
    budget: 'low',
    color: '#92400E',
    tagline: 'Read together, grow together',
    bestTime: 'Evening',
    steps: [
      'Choose a book you both want to read',
      'Set reading goals or chapters to complete',
      'Read separately or out loud together',
      'Discuss your thoughts and favorite parts',
      'Pick the next book together when done'
    ],
    challenges: [
      { id: 'c40-1', title: 'Genre swap', description: 'Take turns picking books in different genres' },
      { id: 'c40-2', title: 'Reading ritual', description: 'Read together for 30 minutes every night' },
      { id: 'c40-3', title: 'Deep discussion', description: 'Have a meaningful conversation about the themes' }
    ]
  },
  {
    id: '41',
    title: 'Spa Night',
    description: 'Pamper at home',
    icon: 'sparkles-outline',
    category: 'cozy',
    duration: '2-3h',
    budget: 'low',
    color: '#92400E',
    tagline: 'Relax, rejuvenate, reconnect',
    bestTime: 'Night',
    steps: [
      'Get face masks, candles, and spa supplies',
      'Create a relaxing atmosphere with music and dim lights',
      'Give each other massages',
      'Do face masks together',
      'End with a relaxing bath or shower'
    ],
    challenges: [
      { id: 'c41-1', title: 'Full treatment', description: 'Do face masks, foot soaks, and massages' },
      { id: 'c41-2', title: 'DIY spa products', description: 'Make your own face masks from natural ingredients' },
      { id: 'c41-3', title: 'Phone-free zone', description: 'No phones for the entire spa session' }
    ]
  },
  {
    id: '42',
    title: 'Puzzle Night',
    description: 'Piece by piece',
    icon: 'extension-puzzle-outline',
    category: 'cozy',
    duration: '2-3h',
    budget: 'low',
    color: '#92400E',
    tagline: 'Together we complete the picture',
    bestTime: 'Evening',
    steps: [
      'Choose a puzzle with an image you both like',
      'Set up a puzzle-friendly workspace',
      'Put on some background music or a podcast',
      'Work together to find pieces',
      'Frame it when done as a memory'
    ],
    challenges: [
      { id: 'c42-1', title: '1000 pieces', description: 'Complete a puzzle with at least 1000 pieces' },
      { id: 'c42-2', title: 'One session', description: 'Finish the entire puzzle in one sitting' },
      { id: 'c42-3', title: 'No peeking', description: 'Don\'t look at the picture on the box' }
    ]
  },
  {
    id: '43',
    title: 'Blanket Fort',
    description: 'Childhood magic',
    icon: 'bed-outline',
    category: 'cozy',
    duration: '3h',
    budget: 'free',
    color: '#92400E',
    tagline: 'Build your own little world',
    bestTime: 'Evening',
    steps: [
      'Gather all your blankets, pillows, and cushions',
      'Build the most elaborate fort you can',
      'String up fairy lights inside',
      'Watch a movie or play games in the fort',
      'Fall asleep inside if you want'
    ],
    challenges: [
      { id: 'c43-1', title: 'Epic fort', description: 'Use at least 10 blankets in your construction' },
      { id: 'c43-2', title: 'Movie marathon', description: 'Watch three movies without leaving the fort' },
      { id: 'c43-3', title: 'Overnight stay', description: 'Sleep in the fort for the night' }
    ]
  },
  {
    id: '44',
    title: 'Cook Together',
    description: 'New recipe adventure',
    icon: 'flame-outline',
    category: 'cozy',
    duration: '2h',
    budget: 'low',
    color: '#92400E',
    tagline: 'The kitchen is our playground',
    bestTime: 'Evening',
    steps: [
      'Pick a recipe you\'ve never made before',
      'Shop for all the ingredients together',
      'Prep and cook side by side',
      'Taste and adjust as you go',
      'Enjoy your homemade meal together'
    ],
    challenges: [
      { id: 'c44-1', title: 'Three courses', description: 'Make a full three-course meal together' },
      { id: 'c44-2', title: 'International night', description: 'Cook a dish from a country you\'ve never been to' },
      { id: 'c44-3', title: 'No recipe', description: 'Cook something completely from intuition' }
    ]
  },

  // Cultural
  {
    id: '45',
    title: 'Museum Visit',
    description: 'Art and history',
    icon: 'business-outline',
    category: 'cultural',
    duration: '2-3h',
    budget: 'low',
    color: '#6366F1',
    tagline: 'Explore the past, imagine the future',
    bestTime: 'Afternoon',
    steps: [
      'Choose a museum that interests both of you',
      'Check for special exhibitions or events',
      'Take your time wandering through exhibits',
      'Discuss what you see and learn',
      'Visit the museum shop or cafe afterward'
    ],
    challenges: [
      { id: 'c45-1', title: 'Find your favorite', description: 'Each pick your favorite piece and explain why' },
      { id: 'c45-2', title: 'Learn together', description: 'Read at least 10 information plaques together' },
      { id: 'c45-3', title: 'Get inspired', description: 'Talk about how the art makes you feel' }
    ]
  },
  {
    id: '46',
    title: 'Art Gallery',
    description: 'Discover new artists',
    icon: 'image-outline',
    category: 'cultural',
    duration: '1-2h',
    budget: 'free',
    color: '#6366F1',
    tagline: 'Where creativity speaks',
    bestTime: 'Afternoon',
    steps: [
      'Find a local art gallery or exhibition',
      'Take your time with each piece',
      'Share your interpretations with each other',
      'Talk to the artist if they\'re present',
      'Support local art by buying something small'
    ],
    challenges: [
      { id: 'c46-1', title: 'Different perspectives', description: 'Each share what you see in the same piece' },
      { id: 'c46-2', title: 'Artist meet', description: 'Talk to at least one artist about their work' },
      { id: 'c46-3', title: 'Postcard memory', description: 'Get a postcard or print to remember the visit' }
    ]
  },
  {
    id: '47',
    title: 'Theater Show',
    description: 'Live performance magic',
    icon: 'ticket-outline',
    category: 'cultural',
    duration: '3h',
    budget: 'high',
    color: '#6366F1',
    tagline: 'The magic of live performance',
    bestTime: 'Evening',
    steps: [
      'Choose a play, musical, or performance',
      'Book good seats in advance',
      'Dress up for the occasion',
      'Arrive early to soak in the atmosphere',
      'Discuss the show over dinner or drinks after'
    ],
    challenges: [
      { id: 'c47-1', title: 'Dress to impress', description: 'Both dress up like it\'s opening night' },
      { id: 'c47-2', title: 'Try something new', description: 'See a type of performance you\'ve never seen before' },
      { id: 'c47-3', title: 'Standing ovation', description: 'Give a standing ovation if you loved it' }
    ]
  },
  {
    id: '48',
    title: 'History Tour',
    description: 'Explore your city',
    icon: 'map-outline',
    category: 'cultural',
    duration: '2-3h',
    budget: 'low',
    color: '#6366F1',
    tagline: 'Discover stories where you live',
    bestTime: 'Morning',
    steps: [
      'Research historical walking tours in your area',
      'Book a guided tour or create your own route',
      'Visit historical landmarks and sites',
      'Learn about the history of your city',
      'Take photos at significant locations'
    ],
    challenges: [
      { id: 'c48-1', title: 'Local historian', description: 'Learn three new facts about your city' },
      { id: 'c48-2', title: 'Hidden gems', description: 'Find a place you never knew existed' },
      { id: 'c48-3', title: 'Story time', description: 'Share the most interesting story you learned' }
    ]
  },
  {
    id: '49',
    title: 'Language Date',
    description: 'Learn together',
    icon: 'language-outline',
    category: 'cultural',
    duration: '1-2h',
    budget: 'free',
    color: '#6366F1',
    tagline: 'Say "I love you" in a new way',
    bestTime: 'Evening',
    steps: [
      'Choose a language you both want to learn',
      'Use a language app or video lessons',
      'Practice basic phrases together',
      'Have a conversation only in that language',
      'Plan to use it on a future trip together'
    ],
    challenges: [
      { id: 'c49-1', title: 'Dinner in the language', description: 'Order food or cook while only speaking the new language' },
      { id: 'c49-2', title: 'Learn 20 words', description: 'Both learn and use 20 words or phrases' },
      { id: 'c49-3', title: 'Love phrases', description: 'Learn how to say romantic phrases' }
    ]
  },
  {
    id: '50',
    title: 'Festival',
    description: 'Culture and celebration',
    icon: 'globe-outline',
    category: 'cultural',
    duration: '3-4h',
    budget: 'low',
    color: '#6366F1',
    tagline: 'Celebrate life and culture',
    bestTime: 'All day',
    steps: [
      'Find a local festival or cultural event',
      'Arrive early to see everything',
      'Try different foods from vendors',
      'Watch performances and participate in activities',
      'Buy something to remember the experience'
    ],
    challenges: [
      { id: 'c50-1', title: 'Try it all', description: 'Sample at least five different foods' },
      { id: 'c50-2', title: 'Join the fun', description: 'Participate in an activity or workshop' },
      { id: 'c50-3', title: 'Stay till the end', description: 'Stay for the closing ceremony or event' }
    ]
  },
];

// Budget display helper
const getBudgetDisplay = (budget: DateIdea['budget']): string => {
  switch (budget) {
    case 'free': return 'Free';
    case 'low': return '$';
    case 'medium': return '$$';
    case 'high': return '$$$';
    default: return '$';
  }
};

// Category Chip Component
const CategoryChip: React.FC<{
  category: Category;
  isSelected: boolean;
  onPress: () => void;
}> = ({ category, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        isSelected && styles.categoryChipSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.categoryChipText,
          isSelected && styles.categoryChipTextSelected,
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

// Date Idea Card Component - Enhanced with better hierarchy
const DateIdeaCard: React.FC<{
  idea: DateIdea;
  onPress: () => void;
  isSaved: boolean;
  onToggleSave: (ideaId: string) => void;
}> = ({ idea, onPress, isSaved, onToggleSave }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  // Get category color
  const category = CATEGORIES.find(cat => cat.id === idea.category) || CATEGORIES[0];
  const categoryColor = category.color;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.cardTouchable}
    >
      <Animated.View style={[styles.ideaCard, { transform: [{ scale: scaleAnim }] }]}>
        {/* Heart Save Button */}
        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => onToggleSave(idea.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={18}
            color={isSaved ? '#E11D48' : '#9CA3AF'}
          />
        </TouchableOpacity>

        {/* Icon with white background and colored shadow */}
        <View style={[styles.ideaIconContainer, {
          backgroundColor: '#FFFFFF',
          shadowColor: categoryColor,
        }]}>
          <Ionicons
            name={idea.icon}
            size={22}
            color={categoryColor}
          />
        </View>

        {/* Content wrapper for flex layout */}
        <View style={styles.ideaCardContent}>
          {/* Title */}
          <Text style={styles.ideaTitle} numberOfLines={1}>
            {idea.title}
          </Text>

          {/* Subtitle/Description */}
          <Text style={styles.ideaSubtitle} numberOfLines={2}>
            {idea.description}
          </Text>

          {/* Bottom row: Duration & Budget */}
          <View style={styles.ideaFooter}>
            <View style={[styles.ideaMetaBadge, {
              backgroundColor: `${categoryColor}10`,
              borderColor: `${categoryColor}20`,
            }]}>
              <Ionicons name="time-outline" size={10} color={categoryColor} />
              <Text style={[styles.ideaMetaText, { color: categoryColor }]}>
                {idea.duration}
              </Text>
            </View>
            <View style={[styles.ideaBudgetBadge]}>
              <Text style={styles.ideaBudget}>
                {getBudgetDisplay(idea.budget)}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Main Component
const DateIdeasListScreen: React.FC<DateIdeasListScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customIdeas, setCustomIdeas] = useState<DateIdea[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<Set<string>>(new Set());
  const [doneIdeas, setDoneIdeas] = useState<Set<string>>(new Set());

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;

  // Load custom ideas from AsyncStorage
  const loadCustomIdeas = async () => {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_IDEAS_STORAGE_KEY);
      if (stored) {
        setCustomIdeas(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading custom ideas:', error);
    }
  };

  // Load done ideas from AsyncStorage
  const loadDoneIdeas = async () => {
    try {
      const stored = await AsyncStorage.getItem(DONE_IDEAS_STORAGE_KEY);
      if (stored) {
        setDoneIdeas(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Error loading done ideas:', error);
    }
  };

  // Save done ideas to AsyncStorage
  const saveDoneIdeas = async (ideas: Set<string>) => {
    try {
      await AsyncStorage.setItem(DONE_IDEAS_STORAGE_KEY, JSON.stringify(Array.from(ideas)));
    } catch (error) {
      console.error('Error saving done ideas:', error);
    }
  };

  // Load saved ideas from AsyncStorage
  const loadSavedIdeas = async () => {
    try {
      const stored = await AsyncStorage.getItem(SAVED_IDEAS_STORAGE_KEY);
      if (stored) {
        setSavedIdeas(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Error loading saved ideas:', error);
    }
  };

  // Save saved ideas to AsyncStorage
  const saveSavedIdeas = async (ideas: Set<string>) => {
    try {
      await AsyncStorage.setItem(SAVED_IDEAS_STORAGE_KEY, JSON.stringify(Array.from(ideas)));
    } catch (error) {
      console.error('Error saving saved ideas:', error);
    }
  };

  // Reload custom ideas, done ideas, and saved ideas when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCustomIdeas();
      loadDoneIdeas();
      loadSavedIdeas();
    }, [])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBack = (): void => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation?.goBack();
  };

  const handleCategorySelect = (categoryId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategory(categoryId);
  };

  const handleIdeaPress = (idea: DateIdea) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation?.navigate('DateIdeaDetail', { idea });
  };

  const handleAddIdea = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation?.navigate('DateIdeaEntry');
  };

  const handleToggleSave = async (ideaId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSavedIdeas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ideaId)) {
        newSet.delete(ideaId);
      } else {
        newSet.add(ideaId);
      }
      saveSavedIdeas(newSet);
      return newSet;
    });
  };

  // Combine default and custom ideas, with custom ideas first
  const allIdeas = [...customIdeas, ...DATE_IDEAS];

  // Filter ideas based on category and search
  const filteredIdeas = allIdeas.filter(idea => {
    let matchesCategory = false;
    if (selectedCategory === 'all') {
      matchesCategory = true;
    } else if (selectedCategory === 'liked') {
      matchesCategory = savedIdeas.has(idea.id);
    } else if (selectedCategory === 'done') {
      matchesCategory = doneIdeas.has(idea.id);
    } else if (selectedCategory === 'my-ideas') {
      matchesCategory = idea.isCustom === true;
    } else {
      matchesCategory = idea.category === selectedCategory;
    }
    const matchesSearch = searchQuery.trim() === '' ||
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* ScrollView - scrolls under the header */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 56 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Scrollable Title */}
        <View style={styles.scrollableTitle}>
          <Text style={styles.title}>Date Ideas</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search date ideas..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={18} color="#D1D5DB" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
          style={styles.categoriesContainer}
        >
          {CATEGORIES.map(category => (
            <CategoryChip
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onPress={() => handleCategorySelect(category.id)}
            />
          ))}
        </ScrollView>

        {/* Ideas Grid */}
        {filteredIdeas.length > 0 ? (
          <View style={styles.ideasGrid}>
            {filteredIdeas.map(idea => (
              <DateIdeaCard
                key={idea.id}
                idea={idea}
                onPress={() => handleIdeaPress(idea)}
                isSaved={savedIdeas.has(idea.id)}
                onToggleSave={handleToggleSave}
              />
            ))}
          </View>
        ) : (
          <View style={styles.noResults}>
            <View style={styles.noResultsIcon}>
              <Ionicons name="search-outline" size={32} color="#D1D5DB" />
            </View>
            <Text style={styles.noResultsTitle}>No ideas found</Text>
            <Text style={styles.noResultsText}>
              Try a different search or category
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]} pointerEvents="box-none">
        <View style={styles.headerBlur}>
          <LinearGradient
            colors={[
              'rgba(247, 245, 242, 1)',
              'rgba(247, 245, 242, 0.98)',
              'rgba(247, 245, 242, 0.9)',
              'rgba(247, 245, 242, 0)',
            ]}
            locations={[0, 0.5, 0.8, 1]}
            style={styles.headerGradient}
          />
        </View>

        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.headerSpacer} />

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddIdea}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#1F2937" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Header
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    zIndex: 100,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  headerSpacer: {
    flex: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  // Scrollable Title
  scrollableTitle: {
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },

  // Search
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#1F2937',
    paddingVertical: 0,
  },

  // Categories
  categoriesContainer: {
    marginBottom: 24,
    marginHorizontal: -16,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryChipSelected: {
    backgroundColor: '#1F2937',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },

  // Ideas Grid
  ideasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardTouchable: {
    width: CARD_WIDTH,
  },
  ideaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 180,
    position: 'relative',
  },
  heartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  ideaCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  ideaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  ideaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
    lineHeight: 20,
    marginBottom: 4,
  },
  ideaSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.1,
    lineHeight: 16,
    marginBottom: 12,
  },
  ideaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  ideaMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
  },
  ideaMetaText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  ideaBudgetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  ideaBudgetBadgeFree: {
    backgroundColor: '#D1FAE5',
  },
  ideaDuration: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  ideaBudget: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  ideaBudgetFree: {
    color: '#10B981',
  },

  // No Results
  noResults: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noResultsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  noResultsText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default DateIdeasListScreen;

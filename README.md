# FitLock - BJJ Fitness Tracker

A comprehensive, mobile-first Progressive Web App (PWA) for tracking Brazilian Jiu-Jitsu training, learning techniques, and getting AI-powered workout recommendations.

## Features

### 📊 Dashboard
- **Training Statistics**: Track your week streak, total hours, monthly sessions, and current belt level
- **Recent Activity**: View your latest training sessions at a glance
- **Quick Actions**: Fast access to log workouts and get AI recommendations

### 💪 Workout Tracking
- **Log Training Sessions**: Record gi, no-gi, drilling, open mat, competitions, and private lessons
- **Detailed Metrics**: Track duration, intensity, date, and personal notes
- **Filter & Sort**: View workouts by type and chronologically
- **Local Storage**: All data saved locally in your browser

### 🥋 Technique Library
- **40+ BJJ Techniques**: Comprehensive library of fundamental and advanced techniques
- **Categories**: Guard, Passing, Submissions, Sweeps, Takedowns, and Escapes
- **Search Functionality**: Find techniques quickly by name or description
- **Difficulty Ratings**: Visual difficulty indicators from beginner to advanced
- **Detailed Descriptions**: Learn what each technique involves

### 🏃 Conditioning Programs
- **BJJ Warm-up Drills**: 10-15 minute mobility and movement prep
- **Strength Training**: 30-45 minute power-building program
- **Cardio & Endurance**: 20-30 minute gas tank builder
- **Recovery & Flexibility**: 15-20 minute injury prevention and flexibility work
- **Detailed Exercise Lists**: Complete sets, reps, and durations for each workout

### 🤖 AI Coach
- **Personalized Training Plans**: Get customized weekly training schedules based on your experience
- **Technique Recommendations**: Belt-specific technique focus suggestions
- **Conditioning Advice**: Tailored conditioning programs for BJJ athletes
- **Recovery Guidance**: Injury prevention and recovery protocols
- **AI-Powered Responses**: Uses Hugging Face Mistral-7B for intelligent coaching (with smart fallbacks)

## Technology Stack

- **Frontend**: Pure HTML5, CSS3, and Vanilla JavaScript
- **Design**: Mobile-first responsive design with dark theme
- **Storage**: LocalStorage for persistent data
- **PWA**: Progressive Web App with service worker for offline functionality
- **AI Integration**: Hugging Face Inference API (Mistral-7B-Instruct)

## Installation

### Run Locally

1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. No build process or server required!

```bash
# Navigate to the directory
cd bjj-fitness-app

# Open in browser
open index.html
# or
python3 -m http.server 8000
# Then visit http://localhost:8000
```

### Install as Mobile App (PWA)

#### On iOS (Safari):
1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Scroll and tap "Add to Home Screen"
4. Name it "FitLock" and tap Add

#### On Android (Chrome):
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen" or "Install App"
4. Follow the prompts

## File Structure

```
bjj-fitness-app/
├── index.html          # Main HTML structure
├── style.css           # Styling and animations
├── script.js           # Application logic and AI integration
├── manifest.json       # PWA manifest
├── service-worker.js   # Service worker for offline support
└── README.md          # This file
```

## Usage Guide

### Logging a Workout

1. Navigate to Dashboard or Workouts view
2. Tap "Log Training Session"
3. Fill in:
   - Date
   - Training type (Gi, No-Gi, etc.)
   - Duration in minutes
   - Intensity (1-4)
   - Optional notes
4. Tap "Save Session"

### Browsing Techniques

1. Navigate to Techniques view
2. Use search bar to find specific techniques
3. Filter by category (Guard, Passing, Submissions, etc.)
4. Tap any technique card to view details

### Using Conditioning Programs

1. Navigate to Conditioning view
2. Choose a program:
   - Warm-up Drills
   - Strength Training
   - Cardio & Endurance
   - Recovery & Flexibility
3. View detailed exercise list with sets/reps
4. Follow along with your workout

### AI Coach

1. Navigate to AI Coach view
2. Choose a quick question or type your own
3. Get personalized advice based on:
   - Your training history
   - Current belt level
   - Training frequency
   - Specific questions

## Features in Detail

### Workout Statistics

- **Week Streak**: Counts consecutive weeks with at least one training session
- **Total Hours**: Sum of all training session durations
- **Sessions This Month**: Count of workouts in the current calendar month
- **Current Belt**: Track your progression (default: White belt)

### Data Persistence

All your data is stored locally using browser LocalStorage:
- Workouts are saved automatically
- Data persists between sessions
- Works offline after first load
- No account or login required

### AI Integration

The app uses Hugging Face's free Inference API:
- **Model**: Mistral-7B-Instruct-v0.2
- **Cost**: Free (no API key required)
- **Privacy**: Your questions are sent to Hugging Face API
- **Fallback**: If API fails, smart fallback responses are provided
- **Response Time**: Typically 2-5 seconds

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Safari: ✅ Full support (iOS 11.3+)
- Firefox: ✅ Full support
- Opera: ✅ Full support

## Offline Functionality

Once loaded, the app works offline:
- View all your logged workouts
- Browse the technique library
- Access conditioning programs
- All features except AI coach work without internet
- AI coach will use fallback responses when offline

## Privacy & Data

- **No Server**: All data stays on your device
- **No Tracking**: No analytics or tracking code
- **No Account**: No sign-up or login required
- **Local Storage**: Your workouts are saved in browser storage only
- **AI Queries**: Only your AI coach questions are sent to Hugging Face API

## Customization

### Change Belt Level

Currently hardcoded to "White". To change:
1. Open browser DevTools (F12)
2. Go to Console
3. Type: `appState.currentBelt = "Blue"` (or your belt)
4. Refresh the page

### Add Custom Techniques

To add techniques, edit `script.js` and add entries to the `techniquesData` array:

```javascript
{
    name: 'Your Technique',
    category: 'submissions', // guard, passing, submissions, sweeps, takedowns, escapes
    difficulty: 2, // 1-4
    description: 'Description of the technique'
}
```

### Modify Conditioning Programs

Edit the `conditioningPrograms` object in `script.js` to customize workouts.

## Future Enhancements

Potential features for future versions:
- [ ] Belt progression tracking with automatic level-up
- [ ] Video tutorials for techniques
- [ ] Training timer with rounds and rest periods
- [ ] Competition preparation mode
- [ ] Export training data to CSV
- [ ] Share workouts with training partners
- [ ] Custom technique notes and favorites
- [ ] Integration with fitness wearables
- [ ] Multi-user support
- [ ] Cloud sync option

## Troubleshooting

### App not loading?
- Check browser console for errors (F12)
- Try clearing browser cache
- Ensure JavaScript is enabled

### AI Coach not responding?
- Check internet connection
- API might be rate-limited (fallback responses will work)
- Try again in a few moments

### Lost my workout data?
- Data is stored in browser LocalStorage
- Clearing browser data will delete workouts
- Don't use incognito/private mode for persistent storage

## Development

Built with vanilla web technologies - no frameworks required!

To modify:
1. Edit HTML structure in `index.html`
2. Customize styling in `style.css`
3. Add functionality in `script.js`
4. Refresh browser to see changes

## Credits

- **Icons**: Native emoji icons for maximum compatibility
- **AI**: Powered by Hugging Face Mistral-7B-Instruct
- **Design**: Custom mobile-first dark theme
- **Techniques**: Curated from fundamental BJJ curriculum

## License

This project is open source and available for personal use.

## Support

For issues or suggestions:
1. Check the Troubleshooting section above
2. Review the code comments in `script.js`
3. Modify and customize to fit your needs!

---

**Train hard, stay consistent, and let FitLock help you track your BJJ journey!** 🥋🔒

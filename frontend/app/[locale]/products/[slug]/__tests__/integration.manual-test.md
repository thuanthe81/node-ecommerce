# Manual Integration Test for Auto-Advance Feature

## Test Checklist

### Basic Auto-Advance
- [ ] Gallery with multiple images starts auto-advancing after 5 seconds
- [ ] Images transition with smooth scrolling animation
- [ ] Gallery wraps around from last image to first
- [ ] Single image gallery does not auto-advance

### User Interaction Pause
- [ ] Clicking previous/next buttons pauses auto-advance
- [ ] Clicking thumbnails pauses auto-advance
- [ ] Keyboard navigation (arrow keys) pauses auto-advance
- [ ] Swipe gestures on mobile pause auto-advance
- [ ] Zooming into an image pauses auto-advance
- [ ] Auto-advance resumes after pause duration

### Navigation Button Hover
- [ ] Navigation buttons are hidden by default
- [ ] Hovering over gallery shows navigation buttons
- [ ] Moving mouse away hides navigation buttons
- [ ] On touch devices, buttons are always visible

### Visibility Detection
- [ ] Auto-advance pauses when gallery scrolls out of viewport
- [ ] Auto-advance pauses when switching to another browser tab
- [ ] Auto-advance resumes when gallery becomes visible again

### Accessibility
- [ ] Screen readers announce image changes
- [ ] Users with prefers-reduced-motion see instant transitions (no animation)
- [ ] Navigation buttons have proper ARIA labels

### Configuration
- [ ] autoAdvance prop can disable the feature
- [ ] autoAdvanceInterval prop changes the timing
- [ ] transitionDuration prop changes animation speed
- [ ] Invalid configuration values fall back to defaults

### Backward Compatibility
- [ ] Existing galleries without auto-advance props work normally
- [ ] Manual navigation still works as before
- [ ] Zoom functionality still works
- [ ] Keyboard navigation still works
- [ ] Touch/swipe gestures still work

## How to Test

1. Start the development server: `npm run dev`
2. Navigate to any product page with multiple images
3. Observe the auto-advance behavior
4. Test each interaction type
5. Check browser console for any errors
6. Test with different configurations

## Expected Behavior

- Auto-advance should feel smooth and natural
- User interactions should take priority over auto-advance
- The feature should not interfere with existing functionality
- Performance should remain smooth (60fps animations)

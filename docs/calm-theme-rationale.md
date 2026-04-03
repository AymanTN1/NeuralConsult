# Calm Theme Rationale

## Intent
The frontend theme was redesigned to reduce visual overstimulation for patients in tobacco dependence follow-up. The goal is not to remove clinical seriousness, but to deliver it in a calmer, lower-arousal interface.

## Design choices
- Desaturated blue-green accents instead of neon cyan/red
- Softer contrast and less aggressive glow
- More nature-linked, biophilic cues in the landing page
- Reduced visual density in cards, smoke, shadows, and warning states
- Warmer neutral highlights for guidance instead of urgent red

## Evidence base used
- Andrew J. Elliot, *Color and psychological functioning: a review of theoretical and empirical work*  
  https://pubmed.ncbi.nlm.nih.gov/25883578/
- Lisa Wilms, Daniel Oberfeld, *Color and emotion: effects of hue, saturation, and brightness*  
  https://pubmed.ncbi.nlm.nih.gov/28612080/
- L. Miola et al., *The healing power of nature. Biophilic design applied to healthcare facilities*  
  https://pubmed.ncbi.nlm.nih.gov/40414183/

## Practical translation in NeuralConsult
- `--nc-glow` became a muted mist-blue, not a neon stimulus
- `--nc-glow-2` became a soft sage green linked to recovery and stability
- Warning states shifted from bright red to muted clay / sand tones
- The landing page keeps the 3D educational scene, but with softer lighting, less smoke density, and calmer copy
- Doctor and patient dashboards now use a calmer chart palette while preserving the medical meaning of HAD, Fagerstrom, cravings, stress, and cigarettes

## Important note
These choices are evidence-informed, not presented as a medical treatment by themselves. They support comprehension, emotional regulation, and engagement around the clinical workflow.

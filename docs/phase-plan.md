# bio-lab phase plan (approved 2026-10-25)

Status: Phases 0 to 5 approved. Phase 6 built, awaiting review.

Source: `reference/lesson-4-structures-and-organelles.pdf`, UAE Inspire Science Biology G9 Advanced, Lesson 4 "Structures and Organelles", pp 55-66.

Each phase is both a student-facing unit and a build unit: built, polished and shipped on its own before the next starts.

## Instruments (scientifically honest)

| Instrument | Specimens | Motion |
|---|---|---|
| Light microscope (brightfield, phase contrast, DIC, oil immersion 100x) | wet mounts, stained slides | live: streaming, cilia, swimming |
| Fluorescence / confocal | live cells with fluorescent dyes or tagged proteins | live: organelles moving, cytoskeleton growing |
| TEM | fixed, ultrathin sections | none, false-coloured |
| SEM | fixed, metal-coated surfaces | none, false-coloured |

## Phases

### Phase 0: Lab orientation (the guide)
- Core engine: optical pane shader pipeline, instrument state machines, 3D control widgets, progress storage, sound (muted default).
- Guided practice on the light microscope with the classic letter "e" slide: lamp, slide and clips, 4x/10x/40x, coarse then fine focus, iris/condenser, why the image is flipped. Broken-slide consequence taught here.
- Short guided intros to confocal, TEM, SEM: what each is for, why EM samples are dead.

### Phase 1: Cell Structures (pp 55-56, Fig 16-17)
- Brightfield: onion epidermis with iodine (plant), cheek cells with methylene blue (animal), yogurt bacteria Gram stain at 100x oil immersion (prokaryote: tiny, no nucleus).
- Concepts: cytoplasm, membrane-bound organelles, prokaryote vs eukaryote, factory analogy.

### Phase 2: Cytoskeleton and centrioles (pp 57-58, Fig 18-19)
- Confocal: live cells with fluorescent microtubules and actin, filaments assembling and disassembling in real time.
- TEM: centriole cross-section, ring of 9 microtubule triplets.
- Get It?: summarize structure and function of the cytoskeleton.

### Phase 3: Appendages and cell walls (pp 58-59, Fig 20-21)
- Phase contrast / DIC: live Paramecium, cilia beating like oars; swimming bacterium or sperm, whiplike flagellum.
- SEM: cilia carpet in the trachea (answers the "where in the body are cilia" Infer).
- TEM: 9+2 cross-section of a cilium.
- Brightfield: elodea leaf, rigid cell walls. Prokaryote wall (peptidoglycan) tied back to the Phase 1 Gram stain.
- Get It?: compare and contrast prokaryotic and eukaryotic cell walls.

### Phase 4: The nucleus (p 60, Fig 22)
- Fluorescence: live DNA dye (Hoechst) lighting up nuclei.
- TEM at 44,000x: nuclear envelope, pores, nucleolus, chromatin.
- Interactive slicing: cut a 3D nucleus at different planes to show why TEM cross-sections differ (the Fig 22 Infer).
- Get It?: describe the role of the nucleus.

### Phase 5: Processing energy (p 61, Fig 23-24)
- Brightfield: elodea chloroplasts in cytoplasmic streaming (live, the headline motion shot).
- Confocal: live mitochondria (MitoTracker) moving and dividing.
- TEM: mitochondrion cristae (46,000x), chloroplast thylakoids (16,000x).
- Brightfield: plastids, chromoplasts in red pepper, starch-storing plastids in potato with iodine.

### Phase 6: Manufacturing and shipping proteins (pp 62-63, Fig 25-26)
- TEM: rough ER with ribosome bumps, smooth ER, Golgi stack with budding vesicles (46,000x).
- Confocal: tagged protein travelling ER to Golgi to cell membrane, live (real technique).

### Phase 7: Storage and cleanup (pp 63-64, Fig 27-28)
- Brightfield: red onion epidermis, large coloured central vacuole.
- TEM: plant vacuole (4,500x), lysosome (13,500x).
- Confocal: live lysosomes (LysoTracker).
- Get It?: explain the role of lysosomes.

### Phase 8: Comparing cells and organelles at work (pp 64-66, Table 1)
- Synthesis, no new instrument: trace one protein from DNA in the nucleus to export, through every organelle already seen.
- Table 1 built by the student from their own observations (sort structures by cell type).
- Get It?: justify "cells are the most important units in all living organisms".
- Check Your Progress Q1-6, then the result card (name, date, per-section scores) for the screenshot.

## Decisions
- All assessment is interactive and auto-graded: Get It? prompts, Q3 flowchart (drag-and-drop) and Q6 concept map (sorting) become tasks the app can mark. No self-marking.
- Full specimen preparation for every instrument, guided step by step:
  - Light: wet mount, staining, coverslip at an angle (no bubbles), oil for 100x.
  - Confocal: load live cells into a dish, add the fluorescent dye, wait, rinse.
  - TEM: fix, dehydrate, embed in resin, slice ultrathin sections on the ultramicrotome, stain with heavy metals, place on a grid.
  - SEM: fix, dehydrate, critical-point dry, sputter-coat with gold, mount on a stub.
  - Real waiting times (hours, overnight resin curing) are time-compressed with an on-screen clock, never hidden.
  - Each prep is taught in full the first time it appears (light in Phase 0, confocal and TEM in Phase 2, SEM in Phase 3). Later phases repeat only the steps that change, with the rest run as a fast replay.
  - The TEM ultramicrotome step is the same mechanic as the Phase 4 nucleus slicing, so slicing angle visibly changes the section.

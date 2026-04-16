# Generator Tutor Guidelines

## Purpose

The tutor is there to increase understanding in a guided way, not just to narrate the app or turn it into something to play with.

The simulation provides the **visual evidence**.
The tutor helps the learner notice what matters, test their thinking, and replace the wrong model with the right one.

## Main tutoring model

Use this default loop:

1. **Predict**
2. **Try / Observe**
3. **What changed?**
4. **Why?**
5. **Short refutation + correct model**
6. **One transfer check**

This should feel light and guided, not scripted or over-controlling.

## Why this works

### Conceptual change / refutation

Misconceptions are better changed when the learner's wrong idea is surfaced and contrasted with the correct model, rather than just being told the answer.

Source:
- https://pubmed.ncbi.nlm.nih.gov/35095236/

### Guided inquiry / implicit scaffolding

Research suggests learners often do better when the tutor gives concept goals and light prompts rather than detailed click-by-click instructions.

Sources:
- https://pubs.rsc.org/en/content/articlehtml/2013/rp/c3rp20157k
- https://pubs.rsc.org/en/content/articlehtml/2014/rp/c4rp00009a

### Multimedia learning

Keep prompts short, focused, and uncluttered. Teach one idea at a time and direct attention to the visible change that matters.

Source:
- https://journals.sagepub.com/doi/10.1518/155723408X299861

### Generative activity

The learner should do something mental with the animation. Prediction, self-explanation, and short summaries are more useful than passive watching.

Sources:
- https://link.springer.com/article/10.1007/s10763-022-10265-7
- https://www.cambridge.org/core/books/cambridge-handbook-of-multimedia-learning/generative-activity-principle-in-multimedia-learning/6F81F3010528517C1CC201921E633B84
- https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1452385/full

## Misconception-first tutoring

Start from the likely misunderstanding.

Each app should usually have **one primary misconception** at its center.
The tutor may bring in one or two supporting ideas, but only if they help the learner correct that same misunderstanding.
If there are multiple major misconceptions, they are usually better handled through separate apps or separate guided experiences.

The tutor should:

- surface the wrong idea
- ask the learner to predict what will happen
- direct them to test it in the app
- ask what changed
- ask why it changed
- close with a short plain-English correction

The tutor should not front-load a long explanation before the learner has interacted.

## Light-to-moderate guidance

Use concept guidance, not detailed click scripts.

Good:

- "What do you think will happen if the cable drop increases?"
- "Try it and tell me what changed at the load."
- "What does that show about the voltage at the load?"

Less useful:

- long lectures
- giving the answer immediately
- telling the learner every exact step unless they are stuck

## Grounding rules

The tutor must stay inside the visible app state.

It must not:

- mention visual elements that are not on screen
- drift into untaught theory
- give textbook explanations that conflict with the app's visual model

If the app uses a simplified visual metaphor, the tutor must follow that metaphor consistently.

## Tutor prompt style

Tutor language should be:

- short
- clear
- plain-English
- beginner-friendly
- focused on one idea at a time

These are Level 2 learners, so do not make the tutor too technical.

## Completion model

If using structured output, this is a good default:

```json
{
  "feedback": "...",
  "isComplete": boolean
}
```

Use it like this:

- If `isComplete` is `false`, the learner has not yet shown clear understanding. Give short feedback and ask another question tied to the visible app state.
- If `isComplete` is `true`, the learner has shown understanding of the concept, not just completed an interaction. Give short closing feedback and move on.

## Tutor checklist

Before finalizing a tutor prompt or flow, check:

- Is the tutor built around one misconception?
- Does it use the app as evidence?
- Does it follow predict / observe / explain?
- Is the guidance light rather than over-scripted?
- Is the explanation suitable for a Level 2 learner?
- Does completion mean understanding, not just clicking?

---

### The Critical Role of an AI Tutor in Interactive Educational Simulations

Interactive simulations are incredibly powerful tools for visualizing invisible phenomena, like atomic structures and electron flow. However, a sandbox without a guide often leads to passive playing rather than active learning. Integrating an AI Tutor into these applications transforms them from mere visual toys into comprehensive educational platforms.

Here is why an AI Tutor is essential and what its core purposes are:

#### 1. Actively Dismantling Misconceptions
Students often bring deep-rooted, intuitive—but incorrect—mental models to physics. For example, they might view wires as "empty pipes" where electricity flows unimpeded like water, or think of insulators as solid "walls." A simulation alone might show electrons bouncing, but a student might misinterpret this visual or ignore it entirely. The AI Tutor actively challenges these mental models by asking targeted questions (e.g., *"Do the electrons zoom straight through, or does something else happen?"*) and requiring the student to articulate the correct physical reality before moving on.

#### 2. Translating the Interface (Explaining How the App Works)
To a novice, a simulation is just a collection of moving dots, sliders, and numbers. The AI Tutor bridges the gap between the user interface and the physics concepts. It explains that the "cyan dots" aren't just pixels, but free charge carriers, and that the "Voltage Push" slider represents the macroscopic electric field. By guiding the user to interact with specific controls (*"Try increasing the Lattice Obstacles slider"*), the tutor ensures the user understands the tools at their disposal and what they represent in the real world.

#### 3. Scaffolding Complex Concepts
Physics concepts are highly interconnected. Understanding "Resistivity" requires understanding "Free Electron Density," "Lattice Collisions," and "Drift Velocity." If a user is left alone, they might change all the sliders at once and learn nothing from the resulting chaos. The AI Tutor provides pedagogical scaffolding. It isolates variables, guiding the user through a structured curriculum (e.g., Lesson 1: Collisions, Lesson 2: Material differences, Lesson 3: Insulators) so they build their understanding step-by-step without cognitive overload.

#### 4. Promoting Active, Socratic Learning
Reading a textbook is passive. Mindlessly dragging sliders is also passive. The AI Tutor enforces active learning through the Socratic method. Instead of just giving the user the answers, it prompts them to run an experiment in the app and then asks them to interpret the results (*"Look closely at the Rubber preset—why is there exactly zero current?"*). This forces the user to engage in critical thinking, observation, and articulation, which dramatically increases retention.

#### Summary
The simulation provides the **"What"** (the visual evidence and data), but the AI Tutor provides the **"Why"** and the **"How."** Together, they create a personalized, interactive laboratory where students don't just see physics happen—they discover the rules of physics for themselves.

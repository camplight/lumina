# Lumina

An AI-first [moldable development](https://moldabledevelopment.com/) environment.

# Guiding Principles

1. Tools Should Mold to Problems, Not Problems to Tools

    When you encounter a new type of data, system, or problem, your first instinct should be: "Can I create a custom view/tool for this?" rather than "How do I force this into my existing tools?" Every decision should favor making it trivially easy to create domain-specific tools.

2. Context is Primary, Code is Secondary

    The environment should always prioritize showing you what the system is doing right now over just showing you what the code says. When deciding between displaying static code or live, interactive representations of running systems, choose the latter. Examples should be executable and embedded everywhere.

3. Reduce the Distance Between Question and Answer

    Every layer of indirection between "I wonder what this does?" and seeing the answer is friction to eliminate. When choosing between requiring someone to run a command, open another window, or see results inline immediately, always choose immediate. Inspection should be instantaneous and in-place.

4. Make the Implicit Explicit

    When you have to choose between hiding complexity or surfacing it through better visualization, choose visualization. Program behavior, data flow, state changes, and system structure should all be inspectable. If something is happening, there should be a way to see it.

5. Composability Over Monoliths

    Each tool, view, or inspector should be a composable piece that can be embedded in other contexts. When building a feature, ask: "Can this be used as a component in something else?" rather than "Does this work standalone?" Views should nest, tools should combine, and everything should be remixable.

6. Examples are First-Class Artifacts

    Examples aren't just documentation—they're executable specifications, tests, and exploration tools. When adding any feature or API, simultaneously ask: "What's the example that demonstrates this?" Make examples as easy to create as the code itself.

7. Immediate Feedback Loops

    The environment should show you the consequences of changes as you make them. When deciding between batch processing and incremental updates, choose incremental. When choosing between deferred evaluation and immediate, choose immediate (unless there's a compelling reason otherwise).

8. Progressive Disclosure, Not Overwhelming Complexity

    Start simple and reveal complexity on demand. When designing any view or tool, ask: "What's the 80% case?" Show that clearly, then make the remaining 20% available through progressive exploration. Users should never feel overwhelmed by options they don't need right now.

9. Object-Centric Navigation

    The primary unit of navigation should be the object/data itself, not the file that contains it. When building navigation features, prioritize "show me all the places this is used" or "show me where this comes from" over traditional file-tree browsing.

10. Malleable from Within

    The environment should be built using itself and modifiable from within itself. When adding capabilities, ask: "Can I use this to improve the environment itself?" The best test of your tools is whether you want to use them to build more tools.

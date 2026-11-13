# Usabilidad

Cuando se implementa o se corrige un módulo, se lee `../havectrl-backend/docs/producto/` antes de dibujar la pantalla. Una duda abierta no se cierra. Si el manual y el resumen chocan, manda `../havectrl-backend/docs/producto/04-apis-e-iteraciones.md`.

La pantalla coincide con la tarea. El título, el botón y el formulario dicen lo mismo. Si la vista muestra asignaciones de todos los tipos, el botón no dice solo «asignar vuelo».

No hay selección implícita. Entrar a la vista no elige a la primera persona de la lista. Asignar tiene dos caminos, y los dos nombran a quién:

1. Se busca a la persona y se pulsa el día. El formulario abre con esa persona y ese día.
2. Se pulsa el botón de alta. El formulario llega vacío y la persona es el primer campo.

Editar es pulsar la asignación de esa persona en ese día. Moverla a otro día puede ser el formulario o arrastrarla. El arrastre solo cambia el día y se guarda, sin un segundo formulario.

Al volver a abrir un alta, el formulario está limpio. No reaparece lo que se acaba de guardar.

Lo que la pantalla ya sabe (persona, día, tipo visible en la celda) no se vuelve a pedir. Quien opera tiene que entender la vista sin leer un manual.

Ejemplo que no se repite: Programación de Crew, con un calendario de todos los tipos, un botón «Asignar vuelo» y el alta tomada como si el primer tripulante estuviera elegido.

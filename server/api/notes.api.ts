import { Type, type Static } from '@sinclair/typebox';
import type { Context } from 'hono';
import { requireAuth, requireUser } from '@basics/core/server/auth';
import type { NoteService } from '../services/note.service';

const ParentKind = Type.Union([
    Type.Literal('lesson'),
    Type.Literal('student'),
    Type.Literal('training_session'),
    Type.Literal('exercise_question'),
    Type.Literal('lesson_exercise'),
    Type.Literal('training_session_exercise'),
    Type.Literal('goal'),
]);
const Visibility = Type.Union([Type.Literal('private'), Type.Literal('shared')]);

const CreateInput = Type.Object({
    parentKind: ParentKind,
    parentId: Type.String({ minLength: 1 }),
    body: Type.String({ minLength: 1 }),
    visibility: Visibility,
});

const ListInput = Type.Object({
    parentKind: ParentKind,
    parentId: Type.String({ minLength: 1 }),
});

const UpdateInput = Type.Object({
    id: Type.String({ minLength: 1 }),
    body: Type.Optional(Type.String({ minLength: 1 })),
    visibility: Type.Optional(Visibility),
});

const DeleteInput = Type.Object({
    id: Type.String({ minLength: 1 }),
});

export function createNotesApi(svc: NoteService) {
    return {
        create: {
            method: 'POST' as const,
            path: '/notes',
            schema: CreateInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof CreateInput>, c: Context) => {
                const user = requireUser(c);
                return svc.create(user.id, input);
            },
        },
        list: {
            method: 'GET' as const,
            path: '/notes',
            schema: ListInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof ListInput>, c: Context) => {
                const user = requireUser(c);
                return svc.listFor(user.id, input);
            },
        },
        update: {
            method: 'PATCH' as const,
            path: '/notes/:id',
            schema: UpdateInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof UpdateInput>, c: Context) => {
                const user = requireUser(c);
                const { id, ...patch } = input;
                return svc.update(user.id, id, patch);
            },
        },
        delete: {
            method: 'DELETE' as const,
            path: '/notes/:id',
            schema: DeleteInput,
            middleware: [requireAuth()],
            fn: async (input: Static<typeof DeleteInput>, c: Context) => {
                const user = requireUser(c);
                await svc.delete(user.id, input.id);
                return { ok: true };
            },
        },
    };
}

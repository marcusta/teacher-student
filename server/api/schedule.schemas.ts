import { Type } from '@sinclair/typebox';

export const Id = Type.String({ minLength: 1, maxLength: 100 });
export const DateValue = Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' });
export const TimeValue = Type.Union([Type.String({ pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' }), Type.Null()]);
export const NoteValue = Type.String({ maxLength: 5000 });
export const Ids = Type.Array(Id, { maxItems: 100, uniqueItems: true });
export const Version = Type.Integer({ minimum: 1 });
export const StablePath = { stableId: Id };
export const ActivityPath = { ...StablePath, activityId: Id };
export const PlanningFields = {
    typeId: Id, horseId: Type.Optional(Type.Union([Id, Type.Null()])), title: Type.String({ minLength: 1, maxLength: 200 }),
    date: DateValue, time: Type.Optional(TimeValue), offsetMinutes: Type.Optional(Type.Union([Type.Integer({ minimum: -840, maximum: 840 }), Type.Null()])),
    instruction: Type.Optional(NoteValue), assigneeIds: Type.Optional(Ids), trainingStudentId: Type.Optional(Type.Union([Id, Type.Null()])),
    programIds: Type.Optional(Ids), exerciseIds: Type.Optional(Ids),
};
export const OutcomeFields = { resultNote: Type.Optional(NoteValue), performerIds: Type.Optional(Ids), performedAt: Type.Optional(Type.String({ minLength: 20, maxLength: 40 })) };
export const UpdateFields = { ...PlanningFields, resultNote: NoteValue, performedAt: Type.String({ minLength: 20, maxLength: 40 }), performerIds: Ids };

import { db as client } from '../client';

export async function SaveHorariosUsers({ userId, payload }: { userId: string, payload: any }): Promise<boolean> {
    try {
        const id = crypto.randomUUID();
        // Mapeo del payload a columnas reales de la tabla
        const data = {
            id, // usas el userId como PK
            monday_start_at: payload.lunes.start,
            monday_end_at: payload.lunes.end,

            tuesday_start_at: payload.martes.start,
            tuesday_end_at: payload.martes.end,

            wednesday_start_at: payload.miercoles.start,
            wednesday_end_at: payload.miercoles.end,

            thursday_start_at: payload.jueves.start,
            thursday_end_at: payload.jueves.end,

            friday_start_at: payload.viernes.start,
            friday_end_at: payload.viernes.end,

            saturday_start_at: payload.sabado.start,
            saturday_end_at: payload.sabado.end,

            sunday_start_at: payload.domingo.start,
            sunday_end_at: payload.domingo.end,

            userId
        };

        // UPSERT — si existe actualiza, si no, inserta
        await client.execute({
            sql: `
                INSERT INTO settings_agend_time (
                    id,
                    monday_start_at, monday_end_at,
                    tuesday_start_at, tuesday_end_at,
                    wednesday_start_at, wednesday_end_at,
                    thursday_start_at, thursday_end_at,
                    friday_start_at, friday_end_at,
                    saturday_start_at, saturday_end_at,
                    sunday_start_at, sunday_end_at,
                    userId
                )
                VALUES (
                    :id,
                    :monday_start_at, :monday_end_at,
                    :tuesday_start_at, :tuesday_end_at,
                    :wednesday_start_at, :wednesday_end_at,
                    :thursday_start_at, :thursday_end_at,
                    :friday_start_at, :friday_end_at,
                    :saturday_start_at, :saturday_end_at,
                    :sunday_start_at, :sunday_end_at,
                    :userId
                )
            `,
            args: data
        });

        return true;

    } catch (error) {
        console.error('Error en GetUserGameHeader:', error);
        throw error;
    }
}

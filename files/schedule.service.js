/* ═══════════════════════════════════════════════════════════════
   schedule.service.js — Horario semanal
═══════════════════════════════════════════════════════════════ */

var ScheduleService = (function () {
  'use strict';

  return {
    async getAll() {
      return DB.getAll('horario', 'dia ASC');
    },

    async getByDay(dia) {
      var rows = await DB.getWhere('horario', { dia: dia });
      return rows.sort(function (a, b) {
        return a.horaInicio < b.horaInicio ? -1 : 1;
      });
    },

    async getByGroup(groupId) {
      return DB.getWhere('horario', { groupId: groupId });
    },

    async save(data) {
      if (data.dia === undefined || data.dia === null)
        return { ok: false, msg: 'El día es obligatorio.' };
      if (!data.groupId)
        return { ok: false, msg: 'Selecciona un grupo.' };

      var record = {
        id:         data.id || Utils.id(),
        dia:        +data.dia,
        horaInicio: data.horaInicio || '',
        horaFin:    data.horaFin    || '',
        groupId:    data.groupId,
        aula:       (data.aula || '').trim()
      };
      await DB.upsert('horario', record);
      return { ok: true, record: record };
    },

    async remove(id) {
      await DB.remove('horario', id);
      return true;
    },

    /** Bloques de hoy según el día de la semana actual */
    async getTodayBlocks() {
      var day = new Date().getDay(); // 0=Dom, 1=Lun … 6=Sáb
      if (day === 0) return []; // Domingo: sin clases
      return this.getByDay(day - 1); // Convertir a índice 0=Lun
    },

    /** Bloque activo en este momento */
    getCurrentBlock(blocks) {
      var now = new Date();
      var cur = now.getHours() * 60 + now.getMinutes();
      return blocks.find(function (b) {
        var s = Utils.timeToMins(b.horaInicio);
        var e = Utils.timeToMins(b.horaFin);
        return s >= 0 && e > s && cur >= s && cur < e;
      }) || null;
    }
  };
})();

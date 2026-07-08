/* ═══════════════════════════════════════════════════════════════
   horario.view.js — Horario semanal visual con hora activa
═══════════════════════════════════════════════════════════════ */

var HorarioView = (function () {
  'use strict';

  var _refreshInterval = null;

  return {
    async render(container) {
      clearInterval(_refreshInterval);
      var grupos = await GroupsService.getAll();

      if (!grupos.length) {
        container.innerHTML =
          '<div class="page-header"><h1 class="page-title">Horario semanal</h1></div>' +
          '<div class="empty-state card"><div class="empty-icon">📅</div>' +
          '<p class="empty-title">Sin grupos creados</p>' +
          '<p class="empty-desc">Crea grupos primero para armar tu horario.</p>' +
          '<button class="btn btn-primary mt-3" id="btnGoGS">Crear grupo</button></div>';
        document.getElementById('btnGoGS').onclick = function () { Router.go('grupos'); };
        return;
      }

      var gMap = {};
      grupos.forEach(function (g) { gMap[g.id] = g; });

      async function draw() {
        var allBlocks = await ScheduleService.getAll();
        var nowMins   = new Date().getHours() * 60 + new Date().getMinutes();
        var todayDia  = new Date().getDay() - 1; // 0=Lun, -1=Dom

        container.innerHTML =
          '<div class="page-header">' +
            '<div><h1 class="page-title">Horario semanal</h1>' +
            '<p class="page-subtitle">Desliza → para ver todos los días</p></div>' +
          '</div>' +
          '<div class="schedule-scroll">' +
            '<div class="schedule-grid">' +
              Utils.DAYS_L.map(function (dia, idx) {
                var blocks = allBlocks
                  .filter(function (b) { return +b.dia === idx; })
                  .sort(function (a, b) { return a.horaInicio < b.horaInicio ? -1 : 1; });
                var isToday = idx === todayDia;

                return '<div class="schedule-col">' +
                  '<div class="schedule-day-hdr" style="' + (isToday ? 'background:var(--accent);' : '') + '">' + dia + '</div>' +
                  blocks.map(function (b) {
                    var g     = gMap[b.groupId];
                    var start = Utils.timeToMins(b.horaInicio);
                    var end   = Utils.timeToMins(b.horaFin);
                    var isNow = isToday && start >= 0 && end > start && nowMins >= start && nowMins < end;
                    return '<div class="schedule-block' + (isNow ? ' now-active' : '') + '" style="border-left:3px solid ' + (g ? g.color : '#ccc') + '">' +
                      (b.horaInicio ? '<div class="time-pill">⏰ ' + Utils.timeLabel(b.horaInicio) + (b.horaFin ? ' – ' + Utils.timeLabel(b.horaFin) : '') + '</div>' : '') +
                      '<p class="font-bold" style="font-size:13px;margin:0">' + (g ? Utils.esc(g.nombre) : '?') + '</p>' +
                      (g && g.asignatura ? '<p class="text-xs text-muted" style="margin:1px 0 0">' + Utils.esc(g.asignatura) + '</p>' : '') +
                      (b.aula ? '<p class="text-xs text-muted" style="margin:1px 0 0">🚪 ' + Utils.esc(b.aula) + '</p>' : '') +
                      (isNow ? '<p class="text-xs" style="color:var(--primary);font-weight:700;margin-top:4px">▶ Ahora</p>' : '') +
                      '<button class="btn btn-xs btn-ghost" style="margin-top:6px;width:100%;color:var(--danger)" data-del-block="' + b.id + '">✕ Quitar</button>' +
                    '</div>';
                  }).join('') +
                  '<button class="btn btn-xs btn-secondary" style="margin-top:6px;width:100%" data-add-dia="' + idx + '">+ Agregar</button>' +
                '</div>';
              }).join('') +
            '</div>' +
          '</div>';

        /* Eventos */
        container.querySelectorAll('[data-del-block]').forEach(function (btn) {
          btn.onclick = async function () {
            await ScheduleService.remove(btn.dataset.delBlock);
            Toast.success('Bloque eliminado.');
            draw();
          };
        });

        container.querySelectorAll('[data-add-dia]').forEach(function (btn) {
          btn.onclick = function () {
            _openAddModal(+btn.dataset.addDia, grupos, draw);
          };
        });
      }

      await draw();

      /* Actualizar highlight cada minuto */
      _refreshInterval = setInterval(function () {
        if (Router.currentView === 'horario') draw();
        else clearInterval(_refreshInterval);
      }, 60000);
    }
  };

  function _openAddModal(dia, grupos, onSave) {
    var formEl = document.createElement('div');
    formEl.innerHTML =
      '<div class="field">' +
        '<label class="field-label">Grupo <span class="field-req">*</span></label>' +
        '<select class="select" id="mbGroup">' +
          '<option value="">Seleccionar…</option>' +
          grupos.map(function (g) {
            return '<option value="' + g.id + '">' + Utils.esc(g.nombre + (g.asignatura ? ' — ' + g.asignatura : '')) + '</option>';
          }).join('') +
        '</select>' +
      '</div>' +
      '<div class="form-row mt-3">' +
        '<div class="field"><label class="field-label">⏰ Hora inicio</label><input class="input" type="time" id="mbHI"></div>' +
        '<div class="field"><label class="field-label">⏰ Hora fin</label><input class="input" type="time" id="mbHF"></div>' +
      '</div>' +
      '<div class="field mt-3">' +
        '<label class="field-label">🚪 Aula / Salón</label>' +
        '<input class="input" type="text" id="mbAula" inputmode="text" autocomplete="off" placeholder="Ej: 301, Lab Física">' +
      '</div>';

    Modal.open({
      title: 'Agregar a ' + Utils.DAYS_L[dia],
      content: formEl,
      actions: [
        { label: 'Cancelar', variant: 'ghost' },
        {
          label: 'Agregar', variant: 'primary', closeOnClick: false,
          onClick: async function () {
            var res = await ScheduleService.save({
              dia:        dia,
              groupId:    document.getElementById('mbGroup').value,
              horaInicio: document.getElementById('mbHI').value,
              horaFin:    document.getElementById('mbHF').value,
              aula:       document.getElementById('mbAula').value.trim()
            });
            if (!res.ok) { Toast.error(res.msg); return; }
            Modal.close();
            Toast.success('Bloque agregado.');
            if (onSave) onSave();
          }
        }
      ]
    });
  }
})();

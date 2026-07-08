/* ═══════════════════════════════════════════════════════════════
   grupos.view.js — Lista de grupos con crear / editar / eliminar
═══════════════════════════════════════════════════════════════ */

var GruposView = (function () {
  'use strict';

  return {
    async render(container) {
      var grupos = await GroupsService.enrichGroups(await GroupsService.getAll());
      _draw(container, grupos);
    },

    /* ── Modal crear / editar grupo ── */
    openModal(existing, onSave) {
      var g = existing || { nombre: '', asignatura: '', color: '#2D6A4F' };
      var selectedColor = g.color;

      // Colores en uso para sugerir el siguiente
      GroupsService.getAll().then(function (all) {
        var usedColors = all.map(function (x) { return x.color; }).filter(function (c) { return c !== g.color; });
        if (!existing) selectedColor = Utils.nextColor(usedColors);
        document.querySelectorAll('.color-swatch').forEach(function (sw) {
          if (sw.dataset.color === selectedColor) sw.classList.add('selected');
        });
      });

      var formEl = document.createElement('div');
      formEl.innerHTML =
        '<div class="field">' +
          '<label class="field-label">Nombre del grupo <span class="field-req">*</span></label>' +
          '<input class="input" type="text" id="mgNombre" inputmode="text" autocomplete="off" placeholder="Ej: 901, 10B, Matemáticas" value="' + Utils.esc(g.nombre) + '">' +
        '</div>' +
        '<div class="field mt-3">' +
          '<label class="field-label">Asignatura</label>' +
          '<input class="input" type="text" id="mgAsig" inputmode="text" autocomplete="off" placeholder="Ej: Matemáticas, Español" value="' + Utils.esc(g.asignatura) + '">' +
        '</div>' +
        '<div class="field mt-3">' +
          '<label class="field-label">Color identificador</label>' +
          '<div class="color-picker">' +
            Utils.GROUP_COLORS.map(function (c) {
              return '<div class="color-swatch' + (g.color === c ? ' selected' : '') + '" data-color="' + c + '" style="background:' + c + '"></div>';
            }).join('') +
          '</div>' +
        '</div>';

      formEl.querySelectorAll('.color-swatch').forEach(function (sw) {
        sw.addEventListener('click', function () {
          formEl.querySelectorAll('.color-swatch').forEach(function (s) { s.classList.remove('selected'); });
          sw.classList.add('selected');
          selectedColor = sw.dataset.color;
        });
      });

      Modal.open({
        title: existing ? 'Editar grupo' : 'Nuevo grupo',
        content: formEl,
        actions: [
          { label: 'Cancelar', variant: 'ghost' },
          {
            label: 'Guardar', variant: 'primary', closeOnClick: false,
            onClick: async function () {
              var res = await GroupsService.save({
                id:         g.id,
                createdAt:  g.createdAt,
                nombre:     document.getElementById('mgNombre').value.trim(),
                asignatura: document.getElementById('mgAsig').value.trim(),
                color:      selectedColor
              });
              if (!res.ok) { Toast.error(res.msg); return; }
              Modal.close();
              Toast.success(existing ? 'Grupo actualizado.' : 'Grupo creado.');
              if (onSave) onSave(res.record);
            }
          }
        ]
      });
    }
  };

  function _draw(container, grupos) {
    container.innerHTML =
      '<div class="page-header">' +
        '<div><h1 class="page-title">Mis grupos</h1>' +
        '<p class="page-subtitle">' + grupos.length + ' ' + Utils.plural(grupos.length, 'grupo') + '</p></div>' +
        '<button class="btn btn-primary" id="btnNuevoGrupo">+ Nuevo</button>' +
      '</div>' +
      (grupos.length === 0 ?
        '<div class="empty-state card"><div class="empty-icon">🏫</div>' +
        '<p class="empty-title">Sin grupos todavía</p>' +
        '<p class="empty-desc">Crea un grupo para cada curso que atiendas.</p></div>' :
        '<div class="groups-grid">' +
          grupos.map(function (g) {
            return '<div class="group-card" style="border-top:3px solid ' + g.color + '">' +
              '<div class="flex justify-between items-center" style="margin-bottom:10px">' +
                '<div style="min-width:0">' +
                  '<p class="font-bold truncate" style="font-size:16px">' + Utils.esc(g.nombre) + '</p>' +
                  (g.asignatura ? '<p class="text-sm text-muted truncate">' + Utils.esc(g.asignatura) + '</p>' : '') +
                '</div>' +
                '<div class="flex gap-2">' +
                  '<button class="icon-btn" data-edit-gid="' + g.id + '" title="Editar" style="font-size:16px">✏️</button>' +
                  '<button class="icon-btn" data-del-gid="' + g.id + '" title="Eliminar" style="font-size:16px">🗑️</button>' +
                '</div>' +
              '</div>' +
              '<p class="text-sm text-muted">' + g.totalClases + ' ' + Utils.plural(g.totalClases, 'clase') + '</p>' +
              (g.tareasPendientes > 0 ?
                '<p class="text-sm" style="color:var(--danger);margin-top:2px">📝 ' + g.tareasPendientes + ' tarea' + (g.tareasPendientes > 1 ? 's' : '') + ' pendiente' + (g.tareasPendientes > 1 ? 's' : '') + '</p>' : '') +
              '<button class="btn btn-primary btn-block mt-3" data-ver-gid="' + g.id + '">Ver grupo →</button>' +
            '</div>';
          }).join('') +
        '</div>');

    /* Eventos */
    document.getElementById('btnNuevoGrupo').onclick = function () {
      GruposView.openModal(null, async function () {
        var gs = await GroupsService.enrichGroups(await GroupsService.getAll());
        _draw(container, gs);
      });
    };

    container.querySelectorAll('[data-edit-gid]').forEach(function (btn) {
      btn.onclick = async function (e) {
        e.stopPropagation();
        var g = await GroupsService.getById(btn.dataset.editGid);
        GruposView.openModal(g, async function () {
          var gs = await GroupsService.enrichGroups(await GroupsService.getAll());
          _draw(container, gs);
        });
      };
    });

    container.querySelectorAll('[data-del-gid]').forEach(function (btn) {
      btn.onclick = async function (e) {
        e.stopPropagation();
        var ok = await Modal.confirm({
          title: 'Eliminar grupo',
          message: '¿Eliminar este grupo y TODAS sus clases registradas? Esta acción no se puede deshacer.',
          confirmLabel: 'Eliminar todo',
          danger: true
        });
        if (!ok) return;
        await GroupsService.remove(btn.dataset.delGid);
        Toast.success('Grupo eliminado.');
        var gs = await GroupsService.enrichGroups(await GroupsService.getAll());
        _draw(container, gs);
      };
    });

    container.querySelectorAll('[data-ver-gid]').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        Router.go('grupo', { groupId: btn.dataset.verGid });
      };
    });
  }
})();

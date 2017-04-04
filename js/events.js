// https://developer.mozilla.org/en-US/docs/Web/Events

// Key values: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
// https://developer.mozilla.org/en-US/docs/Web/Events/keydown
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#Exampleselected_cell

const shortcuts = [
    {mode: 'READY', key: 'ArrowLeft', action: { type: 'MOVE_CELL_SELECTION', direction: 'LEFT' }},
    {mode: 'READY', key: 'h', action: { type: 'MOVE_CELL_SELECTION', direction: 'LEFT' }},

    {mode: 'READY', key: 'ArrowUp', action: { type: 'MOVE_CELL_SELECTION', direction: 'UP' }},
    {mode: 'READY', key: 'k', action: { type: 'MOVE_CELL_SELECTION', direction: 'UP' }},

    {mode: 'READY', key: 'j', action: { type: 'MOVE_CELL_SELECTION', direction: 'DOWN' }},
    {mode: 'READY', key: 'ArrowDown', action: { type: 'MOVE_CELL_SELECTION', direction: 'DOWN' }},
    {mode: 'READY', key: 'Enter', action: { type: 'MOVE_CELL_SELECTION', direction: 'DOWN' }},

    {mode: 'READY', key: 'l', action: { type: 'MOVE_CELL_SELECTION', direction: 'RIGHT' }},
    {mode: 'READY', key: 'ArrowRight', action: { type: 'MOVE_CELL_SELECTION', direction: 'RIGHT' }},
    
    // TODO If on the name: delete the declaration entirely
    {mode: 'READY', key: 'Delete', action: { type: 'DELETE_VALUE' }},

    {mode: 'READY', key: 'S', modifiers: (e) => (e.ctrlKey), action: { type: 'SAVE_FILE_AS' }},
    {mode: 'READY', key: 's', modifiers: (e) => (e.ctrlKey), action: { type: 'SAVE_FILE' }},

    {mode: 'READY', key: 'F2', action: { type: 'EDIT_CELL' }},
    // TODO needs to preventDefault?
    {mode: 'READY', key: 'i', action: { type: 'EDIT_CELL' }},
  
    // TOOD how can a user insert a line into the formula bar 
    // without triggering commit? Same way as in Excel?
    {mode: 'EDIT', key: 'Enter', action: { type: 'COMMIT_CELL_EDIT' }},
    {mode: 'EDIT', key: 'Escape', action: { type: 'DISCARD_CELL_EDIT' }},
];
  
/*
if (typeof(sheet) !== "undefined" && sheet.attach) {
  sheet.attach("shortcuts", shortcuts, [1, 1])
}
*/

function process_event (event, store) {

    const state = store.getState();
    const mode = state.mode;

    for (let shortcut of shortcuts) {
        if (event.key === shortcut.key
            && mode === shortcut.mode
            && ((shortcut.modifiers === undefined) || shortcut.modifiers(event))
        ) {
            store.dispatch(shortcut.action);
            return;
        }
    }

    // Catch window closes
    if (event.key == 'w' && event.ctrlKey) {
        event.preventDefault();
        return;
    }

    if (mode === 'READY' && event.key === 'o' && event.ctrlKey) {
        document.getElementById('open-file-manager').click();
        return;
    }
    
}

function get_clicked_cell_location (event) {
    const id = event.target.getAttribute('id');
    let return_value = null;
    try {
        return_value = JSON.parse(id);
    } catch (e) {
        if (e instanceof SyntaxError) {
            console.log("Couldn't read in the clicked element's ID as JSON.");
        } else {
            console.error(e)
        }
    }
    return return_value;
}

// # Event listeners
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Syntax

const bind_grid_events = function(store, grid_element) {
    grid_element.addEventListener('click',
        (event) => {
            const clicked_location = get_clicked_cell_location(event);
            if (clicked_location === null) { return }
            switch (store.getState().mode) {
                case 'READY':
                    store.dispatch({
                        type: 'SELECT_CELL', 
                        location: clicked_location
                    });
                    break;
                case 'EDIT':
                    store.dispatch({ 
                        type: 'INSERT_REFERENCE_FROM_CELL',
                        location: clicked_location
                    });
                    break;
                case 'EDITING_CODE':
                    store.dispatch({ type: 'UNSELECT_CODE' });
                    break;
                default:
                    break;
            }
        }
    );
}

const bind_code_editor_events = function(store, code_editor) {
    code_editor.on('focus', 
        () => store.dispatch({ type: 'SELECT_CODE' })
    );
}

const bind_formula_bar_events = function(store, formula_bar) {
    formula_bar.addEventListener('click',
        () => store.dispatch({ type: 'EDIT_CELL' })
    );
}

const bind_keydown_events = function(store, window) {
    // TODO consider just binding to grid, not whole window?
    // Would require breaking the keyboard logic up a bit.
    window.addEventListener('keydown', 
        (event) => process_event(event, store)
    );
}

// Load logic
const bind_load_file_events = function(store, filepicker) {
    filepicker.addEventListener('change', (event) => {
        const file = event.target.files[0]; 
        if (file && file.path) {
            const path = file.path;
            store.dispatch({type: 'RESET_STATE'});
            store.dispatch({type: 'LOAD_FILE', path: path});
        }
    });
}

module.exports = {
    bind_code_editor_events: bind_code_editor_events,
    bind_keydown_events: bind_keydown_events,
    bind_formula_bar_events: bind_formula_bar_events,
    bind_grid_events: bind_grid_events,
    bind_load_file_events: bind_load_file_events,
}

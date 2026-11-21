import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const COLUMNS = [
  { id: 'To Do', title: 'To Do', accent: 'border-t-slate-400', badge: 'bg-slate-200 text-slate-700' },
  { id: 'In Progress', title: 'In Progress', accent: 'border-t-blue-500', badge: 'bg-blue-100 text-blue-700' },
  { id: 'Done', title: 'Done', accent: 'border-t-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
];

export default function KanbanBoard({ tickets, onStatusChange, onSelectTicket }) {
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    onStatusChange(draggableId, destination.droppableId);
  };

  const priorityBadge = (level) => {
    const styles = {
      low: 'bg-slate-100 text-slate-600',
      medium: 'bg-blue-50 text-blue-700',
      high: 'bg-amber-50 text-amber-700',
      critical: 'bg-rose-50 text-rose-700',
    };
    return styles[level] || styles.medium;
  };

  const typeBadge = (t) => {
    const styles = {
      bug: 'bg-rose-100 text-rose-800',
      feature: 'bg-purple-100 text-purple-800',
      task: 'bg-emerald-100 text-emerald-800',
    };
    return styles[t] || styles.bug;
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COLUMNS.map((col) => {
          const columnTickets = tickets.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className={`bg-slate-100/80 rounded-xl border border-slate-200 border-t-4 ${col.accent} flex flex-col min-h-[420px]`}
            >
              <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200/70">
                <h3 className="font-bold text-sm text-slate-800">{col.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badge}`}>
                  {columnTickets.length}
                </span>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-3 space-y-3 transition-colors rounded-b-xl ${
                      snapshot.isDraggingOver ? 'bg-blue-50/70' : ''
                    }`}
                  >
                    {columnTickets.map((ticket, index) => (
                      <Draggable key={ticket._id} draggableId={ticket._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onSelectTicket(ticket)}
                            className={`bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2.5 select-none cursor-pointer transition ${
                              snapshot.isDragging
                                ? 'shadow-lg ring-2 ring-blue-500 rotate-1'
                                : 'hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${typeBadge(ticket.type)}`}>
                                {ticket.type}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${priorityBadge(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm text-slate-900 leading-snug">
                                {ticket.title}
                              </h4>
                              {ticket.description && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                  {ticket.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                              <span className="font-medium text-slate-600 truncate max-w-[140px]">
                                {ticket.assignee ? `👤 ${ticket.assignee.name}` : 'Unassigned'}
                              </span>
                              <span className="text-blue-600 font-medium">💬 Comments</span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {columnTickets.length === 0 && !snapshot.isDraggingOver && (
                      <div className="h-24 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-xs text-slate-400">
                        Drop issues here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
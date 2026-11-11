const groups = {
  Beds: [
    ["Platform single", 1, 2, 0.85, 290],
    ["Oak queen", 1.6, 2.1, 1, 680],
    ["Upholstered king", 1.95, 2.15, 1.15, 990],
    ["Guest daybed", 0.9, 2, 0.8, 340],
  ],
  Sofas: [
    ["Linen loveseat", 1.6, 0.9, 0.82, 690],
    ["Modular three-seat", 2.35, 1, 0.78, 1250],
    ["Compact settee", 1.35, 0.76, 0.84, 470],
    ["Chaise lounge", 0.82, 1.65, 0.79, 550],
  ],
  Chairs: [
    ["Wishbone dining chair", 0.55, 0.51, 0.76, 140],
    ["Boucle armchair", 0.82, 0.86, 0.76, 365],
    ["Task chair", 0.65, 0.65, 1.12, 210],
    ["Folding chair", 0.45, 0.49, 0.79, 65],
  ],
  Tables: [
    ["Oval dining table", 1.8, 0.95, 0.75, 480],
    ["Travertine coffee table", 1.1, 0.6, 0.37, 320],
    ["Round side table", 0.45, 0.45, 0.46, 95],
    ["Extension table", 2.2, 1, 0.76, 620],
  ],
  Wardrobes: [
    ["Sliding wardrobe", 1.8, 0.65, 2.2, 780],
    ["Walnut armoire", 1.1, 0.59, 1.95, 590],
    ["Single wardrobe", 0.65, 0.56, 1.9, 280],
  ],
  Cabinets: [
    ["Low sideboard", 1.5, 0.42, 0.78, 420],
    ["Media console", 1.65, 0.4, 0.52, 350],
    ["Entry shoe cabinet", 0.82, 0.32, 1.05, 175],
    ["Kitchen base unit", 0.6, 0.6, 0.9, 210],
  ],
  Shelves: [
    ["Ladder shelf", 0.7, 0.42, 1.75, 155],
    ["Open bookcase", 0.9, 0.32, 1.85, 235],
    ["Low display shelf", 1.2, 0.35, 0.8, 185],
  ],
  Desks: [
    ["Writing desk", 1.2, 0.6, 0.75, 290],
    ["Corner workstation", 1.6, 1.2, 0.74, 490],
    ["Standing desk", 1.4, 0.72, 1.15, 510],
  ],
  Other: [
    ["Woven bench", 1.15, 0.42, 0.46, 180],
    ["Leather ottoman", 0.62, 0.62, 0.42, 195],
    ["Kitchen island", 1.45, 0.8, 0.91, 740],
    ["Plant stand", 0.36, 0.36, 0.64, 65],
  ],
};
const descriptions = {
  Beds: [
    "Single mattress on a low platform frame.",
    "Queen bed with an oak surround and full-width headboard.",
    "King mattress and padded headboard with space on both sides.",
    "A narrow guest bed that doubles as daytime seating.",
  ],
  Sofas: [
    "Two-seat sofa with linen upholstery and slim arms.",
    "Three modular seats arranged in a straight run.",
    "A shallow two-seater for small conversation areas.",
    "An extended seat for reclining beside a window.",
  ],
  Chairs: [
    "Curved timber back and woven dining seat.",
    "Deep upholstered reading chair with rounded arms.",
    "Adjustable swivel chair with a wheeled base.",
    "Compact occasional seating that folds for storage.",
  ],
  Tables: [
    "Six-place oval dining surface with softened corners.",
    "Low rectangular stone table for a sofa grouping.",
    "Small circular top for a lamp or refreshments.",
    "Extended dining surface for larger gatherings.",
  ],
  Wardrobes: [
    "Two sliding panels conceal a full hanging rail.",
    "Freestanding double-door cabinet with interior shelves.",
    "Narrow hanging storage for a single bedroom.",
  ],
  Cabinets: [
    "Long, low cabinet for dining linens and serving dishes.",
    "Shallow television unit with equipment storage.",
    "Slim enclosed storage for an entry corridor.",
    "Counter-height base cabinet for a kitchen run.",
  ],
  Shelves: [
    "Leaning display frame with graduated shelves.",
    "Tall open shelving for books and objects.",
    "Waist-high display shelving for an open-plan room.",
  ],
  Desks: [
    "Shallow work surface for writing or laptop use.",
    "Deep work surface for a corner office setup.",
    "Height-adjustable desk shown at standing height.",
  ],
  Other: [
    "Woven entry bench sized for two people.",
    "Square upholstered footstool for a lounge chair.",
    "Freestanding counter with preparation and storage space.",
    "Raised platform sized for a single indoor planter.",
  ],
};
module.exports = Object.entries(groups).flatMap(([category, rows]) =>
  rows.map(([name, width, length, height, price], i) => ({
    category,
    name,
    width,
    length,
    height,
    price,
    description: descriptions[category][i],
  })),
);

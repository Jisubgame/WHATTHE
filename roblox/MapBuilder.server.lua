-- MapBuilder (Script) — ServerScriptService/MapBuilder
-- Builds the ward from Config.GRID as grey boxes: floor, ceiling, walls, the lit lobby, the exit.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting = game:GetService("Lighting")
local StarterPlayer = game:GetService("StarterPlayer")
local Config = require(ReplicatedStorage:WaitForChild("Config"))

local CELL, H, SIZE = Config.CELL, Config.WALL_HEIGHT, Config.SIZE

-- player movement: slower than Roblox default, no jumping
StarterPlayer.CharacterWalkSpeed = Config.PLAYER_WALK
StarterPlayer.CharacterUseJumpPower = true
StarterPlayer.CharacterJumpPower = 0

-- dark, foggy ward
Lighting.ClockTime = 0
Lighting.Brightness = 0
Lighting.Ambient = Color3.fromRGB(18, 18, 20)
Lighting.OutdoorAmbient = Color3.fromRGB(10, 10, 12)
Lighting.FogColor = Color3.fromRGB(5, 5, 6)
Lighting.FogStart = 10
Lighting.FogEnd = 110
Lighting.GlobalShadows = true

local ward = Instance.new("Folder")
ward.Name = "Ward"
ward.Parent = workspace

local function part(name, size, cframe, color, material)
	local p = Instance.new("Part")
	p.Name = name
	p.Anchored = true
	p.Size = size
	p.CFrame = cframe
	p.Color = color
	p.Material = material or Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Parent = ward
	return p
end

-- floor and ceiling as single slabs
local span = SIZE * CELL
local mid = Config.cellToWorld(Config.CENTER, Config.CENTER)
part("Floor", Vector3.new(span, 1, span), CFrame.new(mid.X, -0.5, mid.Z), Color3.fromRGB(70, 68, 64), Enum.Material.Slate)
local ceiling = part("Ceiling", Vector3.new(span, 1, span), CFrame.new(mid.X, H + 0.5, mid.Z), Color3.fromRGB(40, 38, 34), Enum.Material.Concrete)
ceiling.CastShadow = false

-- walls: one part per horizontal run of wall cells (keeps the part count low)
for r = 0, SIZE - 1 do
	local c = 0
	while c < SIZE do
		if Config.cellAt(r, c) == 1 then
			local start = c
			while c + 1 < SIZE and Config.cellAt(r, c + 1) == 1 do c += 1 end
			local a, b = Config.cellToWorld(r, start), Config.cellToWorld(r, c)
			local len = (c - start + 1) * CELL
			part("Wall", Vector3.new(len, H, CELL), CFrame.new((a.X + b.X) / 2, H / 2, a.Z), Color3.fromRGB(150, 160, 150), Enum.Material.Concrete)
		end
		c += 1
	end
end

-- exit door (green until we wire it up)
do
	local p = Config.cellToWorld(Config.EXIT[1], Config.EXIT[2])
	local exit = part("Exit", Vector3.new(CELL, H, CELL), CFrame.new(p.X, H / 2, p.Z), Color3.fromRGB(40, 120, 60), Enum.Material.Metal)
	exit:SetAttribute("Exit", true)
end

-- lobby: always lit, and marked so the monster's pathfinding treats it as off-limits
local zones = Instance.new("Folder")
zones.Name = "Zones"
zones.Parent = ward
local function zone(r, c, label)
	local p = Config.cellToWorld(r, c)
	local z = Instance.new("Part")
	z.Name = label
	z.Anchored = true
	z.CanCollide = false
	z.CanQuery = false
	z.CanTouch = false
	z.Transparency = 1
	z.Size = Vector3.new(CELL, H, CELL)
	z.CFrame = CFrame.new(p.X, H / 2, p.Z)
	local mod = Instance.new("PathfindingModifier")
	mod.Label = label
	mod.Parent = z
	z.Parent = zones
	return z
end
for key in pairs(Config.SAFE) do
	local r, c = key // 100, key % 100
	local z = zone(r, c, "Safe")
	if (r + c) % 2 == 0 then
		local light = Instance.new("PointLight")
		light.Range = 22
		light.Brightness = 1.4
		light.Color = Color3.fromRGB(255, 236, 205)
		light.Parent = z
	end
end
for key in pairs(Config.VENT) do
	zone(key // 100, key % 100, "Vent")
end

-- where players appear
do
	local p = Config.cellToWorld(Config.SPAWN[1], Config.SPAWN[2])
	local spawn = Instance.new("SpawnLocation")
	spawn.Anchored = true
	spawn.Neutral = true
	spawn.Size = Vector3.new(6, 1, 6)
	spawn.CFrame = CFrame.new(p.X, 0.5, p.Z)
	spawn.Transparency = 1
	spawn.CanCollide = false
	spawn.Duration = 0
	spawn.Parent = ward
end

ward:SetAttribute("Built", true)
